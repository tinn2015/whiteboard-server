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
import { Logger, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RoomsService } from '../rooms/rooms.service';
import { CanvasService } from '../canvas/canvas.service';
import { User } from '../entities/user.entity';
import { decode } from '@msgpack/msgpack';
import Piscina = require('piscina');
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
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
    private readonly canvasService: CanvasService,
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.pool = new Piscina({
      filename: path.resolve(__dirname, '../utils/worker-threads.js'),
    });
  }
  async handleConnection(client: any, ...args: any[]) {
    const roomId: string = client.handshake.query.roomId || uuidv4();
    const userId: number = client.handshake.query.userId;
    const name: string = client.handshake.query.userName || '';
    this.logger.log('info', `user: ${userId} socket connect`);
    let user = null;
    try {
      user = await this.userRepository.findOne(
        { id: userId },
        // { relations: ['room3'] },
      );
    } catch (error) {
      this.logger.error('db error: user.findOne', { id: userId });
    }
    // user = await this.userRepository.findOne(
    //   { id: userId },
    //   { relations: ['room1'] },
    // );
    if (user) {
      user.roomId = roomId;
      user.status = 'online';
      user.socket = client.id;
      await this.userRepository.save(user);
      this.logger.log('info', `已存在user ${userId}`);
    } else {
      // 级联创建room -> canvas
      await this.userRepository.save({
        id: userId,
        status: 'online',
        roomId,
        name,
        socket: client.id,
        room: {
          id: roomId,
          status: 'living',
          canvas: { roomId, objectIds: [] },
        },
      });
      this.logger.log('info', `不存在user ${userId}`);
    }
    // const users = await this.userRepository.find({ relations: ['room'] });
    client.join(roomId);
    this.logger.log('info', `user: ${userId} join room  roomId:${roomId}`);
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
    this.logger.log('info', `user ${user.id} 断开 roomId: ${user.roomId}`);
  }
  @SubscribeMessage('draw')
  async handleEvent(@ConnectedSocket() client: any, @MessageBody() data: any) {
    let user = null;
    try {
      user = await this.userRepository.findOne(
        { socket: client.id },
        { relations: ['room'] },
      );
    } catch (error) {
      this.logger.error('draw get user error', error);
    }
    const roomId = user.room.id;
    // 工作线程
    const decryptData = await this.pool.run(data);
    this.canvasService.draw(roomId, decryptData);
    client.to(roomId).emit('syncRoomDraw', data);
  }

  @SubscribeMessage('cmd')
  async handleCmd(@ConnectedSocket() client: any, @MessageBody() data: any) {
    const user = await this.userRepository.findOne(
      { socket: client.id },
      { relations: ['room'] },
    );
    const roomId = user.room.id;
    client.to(roomId).emit('cmd', data);
    // 工作线程
    const decryptData = await this.pool.run(data);
    this.canvasService.cmdHandle(roomId, decryptData);
  }

  // 画笔数据持久化
  @SubscribeMessage('ms')
  async toServe(@ConnectedSocket() client: any, @MessageBody() data: any) {
    const user = await this.userRepository.findOne(
      { socket: client.id },
      { relations: ['room'] },
    );
    const roomId = user.room.id;
    // 工作线程
    const decryptData = await this.pool.run(data);
    this.canvasService.modifiedObjects(roomId, decryptData);
  }
}
