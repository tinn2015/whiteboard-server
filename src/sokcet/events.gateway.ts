import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { RoomsService } from '../rooms/rooms.service';

@WebSocketGateway(80, {
  cors: {
    origin: '*',
  },
})
export class EventGateway implements OnGatewayDisconnect, OnGatewayConnection {
  constructor(private readonly roomsService: RoomsService) {}
  private readonly socketMapRoom = new Map();
  handleConnection(client: any, ...args: any[]) {
    console.log('有人上线', client.id, client.handshake.query.roomId);
    const roomId = client.handshake.query.roomId || uuidv4();
    const userId = client.handshake.query.userId;
    console.log('roomId', roomId);
    // console.log(this.roomsService.rooms);
    this.socketMapRoom.set(client.id, { roomId, userId });
    this.roomsService.joinRoom(roomId, client.id, userId);
    client.join(roomId);
    console.log('sids', client.adapter.sids);
    return {
      roomId,
    };
  }
  handleDisconnect(client: any) {
    // 离线的时候socket.io room中会自动移除
    const { roomId, userId } = this.socketMapRoom.get(client.id);
    this.roomsService.leaveRoom(roomId, userId);
  }
  @SubscribeMessage('draw')
  handleEvent(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    console.log('socket', client.id, data);
    const { roomId } = this.socketMapRoom.get(client.id);
    client.to(roomId).emit('syncRoomDraw', {
      ...data,
    });
  }

  @SubscribeMessage('cmd')
  handleCmd(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const { roomId } = this.socketMapRoom.get(client.id);
    client
      .to(roomId)
      .emit('cmd', { msg: '我是server, 这是我广播的cmd', ...data });
  }
}
