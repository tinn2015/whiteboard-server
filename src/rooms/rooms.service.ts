import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { Users } from '../entities/user.entity';

// import { Room } from './interfaces/rooms.interface'

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private roomRepository: Repository<Room>,
  ) {}
  private readonly rooms = new Map();

  getRooms() {
    return this.roomRepository.find({ relations: ['users'] });
  }

  getRoom(id: string) {
    console.log('getRoom', id);
    return this.roomRepository.findOne({ id }, { relations: ['users'] });
  }

  checkRoomStatus() {
    // 根据是否还有人在线 判断房间状态
  }

  setMaxOnlineUsers() {
    //根据当前人数判断是不是大于 最大人数
  }

  joinRoom(roomId: string, socketId: string, userId: number) {
    console.log(this.rooms, roomId);
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
}
