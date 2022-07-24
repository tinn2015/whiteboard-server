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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RoomsService } from '../rooms/rooms.service';
import { User } from '../entities/user.entity';
import { decode } from '@msgpack/msgpack';
import Piscina = require('piscina');
import * as path from 'path';

@WebSocketGateway(80, {
  cors: {
    origin: '*',
  },
  perMessageDeflate: {
    threshold: 1, // defaults to 1024

    zlibDeflateOptions: {
      chunkSize: 16 * 1024, // defaults to 16 * 1024
    },

    zlibInflateOptions: {
      windowBits: 15, // defaults to 15, LZ77算法所用内存大小 2的14次方， 这个越大压缩率越大
      memLevel: 9, // defaults to 8; 8 y约 133KB
    },

    clientNoContextTakeover: true, // defaults to negotiated value. 每个消息都在单独的内存解压， 避免混淆
    serverNoContextTakeover: true, // defaults to negotiated value.
    serverMaxWindowBits: 10, // defaults to negotiated value.

    concurrencyLimit: 10, // defaults to 10
  },
})
export class EventGateway implements OnGatewayDisconnect, OnGatewayConnection {
  private pool: Piscina;
  constructor(
    private readonly roomsService: RoomsService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    this.pool = new Piscina({
      filename: path.resolve(__dirname, '../utils/worker-threads.js'),
    });
  }
  async handleConnection(client: any, ...args: any[]) {
    console.log('有人上线', client.id, client.handshake.query.roomId);
    const roomId: string = client.handshake.query.roomId || uuidv4();
    const userId: number = client.handshake.query.userId;
    const name: string = client.handshake.query.userName || '';
    console.log('roomId', roomId, userId);
    const user = await this.userRepository.findOne(
      { id: userId },
      // { relations: ['room'] },
    );
    if (user) {
      user.roomId = roomId;
      user.status = 'online';
      user.socket = client.id;
      await this.userRepository.save(user);
    } else {
      await this.userRepository.save({
        id: userId,
        status: 'online',
        roomId,
        name,
        socket: client.id,
        room: { id: roomId, status: 'living' },
      });
    }
    const users = await this.userRepository.find({ relations: ['room'] });
    console.log('users:', users);
    client.join(roomId);
  }
  async handleDisconnect(client: any) {
    // 离线的时候socket.io room中会自动移除
    // 更新房间状态
    // 更新成员状态
    const socket = client.id;
    const user = await this.userRepository.findOne(
      { socket },
      { relations: ['room'] },
    );
    if (!user) {
      console.log('user disconnect error');
      return;
    }
    console.log('handleDisconnect', user);
    user.status = 'offline';
    await this.userRepository.save(user);
  }
  @SubscribeMessage('draw')
  async handleEvent(@ConnectedSocket() client: any, @MessageBody() data: any) {
    const user = await this.userRepository.findOne(
      { socket: client.id },
      { relations: ['room'] },
    );
    console.log('draw', user);
    const roomId = user.room.id;
    // 工作线程
    this.pool.run({ a: 1, b: 2 });

    // drawCanvas(data);
    client.to(roomId).emit('sync', data);
  }

  @SubscribeMessage('cmd')
  async handleCmd(@ConnectedSocket() client: any, @MessageBody() data: any) {
    const user = await this.userRepository.findOne(
      { socket: client.id },
      { relations: ['room'] },
    );
    const roomId = user.room.id;
    client
      .to(roomId)
      .emit('cmd', { msg: '我是server, 这是我广播的cmd', ...data });
  }
}
