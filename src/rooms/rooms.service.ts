import { Injectable } from '@nestjs/common';
// import { Room } from './interfaces/rooms.interface'

@Injectable()
export class RoomsService {
  private readonly rooms = new Map();
  getRoom(id: string, userId: string) {
    if (this.rooms.get(id)) {
      this.rooms.get(id).push(userId);
    } else {
      this.rooms.set(id, [userId]);
    }
    return `roomid:${id}; members: ${this.rooms.get(id)}`;
  }

  joinRoom(roomId: string, socketId: string, userId: string) {
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
