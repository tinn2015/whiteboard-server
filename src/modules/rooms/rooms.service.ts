import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../entities/room.entity';
import { Users } from '../../entities/user.entity';
import { Canvas } from '../../entities/canvas.entity';
import { CanvasService } from '../canvas/canvas.service';
import { UsersService } from '../users/users.service';
import { DeleteRoomDto } from './dto/delete-room.dto';
import { UpdateCurrentPageDto } from './dto/update-page.dto';

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
