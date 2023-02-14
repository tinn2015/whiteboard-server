import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../entities/room.entity';
import { Users } from '../../entities/user.entity';
import { Canvas } from '../../entities/canvas.entity';
import { CanvasService } from '../canvas/canvas.service';
import { UsersService } from '../users/users.service';
import { DeleteRoomDto } from './dto/delete-room.dto';
import { UpdateCurrentPageDto } from './dto/update-page.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

// import { Room } from './interfaces/rooms.interface'

@Injectable()
export class RoomsService {
  constructor(
    @Inject(forwardRef(() => CanvasService))
    private readonly canvasService: CanvasService,
    private readonly usersService: UsersService,
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    @InjectRepository(Users) private userRepository: Repository<Users>,
    @InjectRepository(Canvas) private canvasRepository: Repository<Canvas>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  private readonly rooms = new Map();

  getRooms() {
    return this.roomRepository.find({ relations: ['users', 'canvas'] });
  }

  async getRoom(id: string) {
    console.log('getRoom', id);
    const roomInfo = await this.roomRepository.findOne(
      { id },
      { relations: ['canvas'] },
    );
    const pageIds = roomInfo.canvas.map((i) => i.id);
    const canvas = await this.canvasService.getCanvasByIds(pageIds);
    console.log('getRoom', canvas);
    roomInfo.canvas = canvas;
    return roomInfo;
    // const {canvas} = roomInfo
    // for (let i =0; i < canvas.length; i++) {

    // }
  }

  checkRoomStatus() {
    // 根据是否还有人在线 判断房间状态
  }

  setMaxOnlineUsers() {
    //根据当前人数判断是不是大于 最大人数
  }

  /**
   * 创建房间并上传数据
   * 离线包中创建会议
   * @param roomId
   * @returns
   */
  async createRoom(createRoomDto: CreateRoomDto) {
    const { currentPage, pages, roomId, bg } = createRoomDto;
    this.logger.log('info', 'create room', createRoomDto);

    // 已存在的Room, 先删除再创建
    await this.deleteRoom({ roomId, all: false });

    let currentPageId = 0;
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const canvas = await this.canvasRepository.save({
        roomId: roomId,
        room: {
          id: roomId,
        },
      });
      if (page.objects) {
        await this.canvasService.uploadCanvas({
          roomId,
          pid: canvas.id,
          objects: page.objects,
        });
      }
      console.log('create room set currentpage', page.pid, currentPage);
      if (page.pid === currentPage) {
        currentPageId = canvas.id;
      }
    }

    // update room currentPage
    const room = await this.roomRepository.findOne({
      id: roomId,
    });
    room.currentPage = currentPageId;
    room.background = bg;
    await this.roomRepository.save(room);
    return { msg: 'create room success' };
  }

  joinRoom(roomId: string, socketId: string, userId: number) {
    const userList = this.rooms.get(roomId);
    if (!userList || !userList.length) {
      this.rooms.set(roomId, [{ socketId, userId }]);
    } else {
      userList.push({ socketId, userId });
      this.rooms.set(roomId, userList);
    }
  }

  leaveRoom(roomId: string, userId: string) {
    const userList = this.rooms.get(roomId);
    const userIndex = userList.findIndex((i) => i.userId === userId);
    userList.splice(userIndex, 1);
    this.rooms.set(roomId, userList);
  }

  async deleteRoom(deleteRoomDto: DeleteRoomDto) {
    if (deleteRoomDto.all) {
      const rooms = await this.roomRepository.find({ status: 'closed' });
      if (rooms && rooms.length) {
        await this.roomRepository;
      }
    } else {
      const room = await this.roomRepository.findOne(
        {
          id: deleteRoomDto.roomId,
        },
        {
          relations: ['users', 'canvas'],
        },
      );
      if (room) {
        // 关联删除user
        const userIds = room.users.map((i) => {
          return i.id;
        });
        await this.usersService.batchDeletaUser(userIds, deleteRoomDto.roomId);

        // 关联删除canvas
        const canvasIds = room.canvas.map((i) => {
          return i.id;
        });
        if (canvasIds && canvasIds.length) {
          await this.canvasService.batchDeleteCanvas(
            canvasIds,
            deleteRoomDto.roomId,
          );
        }

        await this.roomRepository.remove(room);
        return { success: true };
      } else {
        return {
          success: false,
          msg: `不存在的room, roomId: ${deleteRoomDto.roomId}`,
        };
      }
    }
  }

  async updateCurrentPage(updateCurrentPageDto: UpdateCurrentPageDto) {
    const room = await this.roomRepository.findOne({
      id: updateCurrentPageDto.roomId,
    });
    room.currentPage = updateCurrentPageDto.pageId;
    await this.roomRepository.save(room);
    return {
      code: 1,
      msg: '更新成功',
    };
  }
}
