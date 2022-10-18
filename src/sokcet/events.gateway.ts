import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CanvasService } from '../canvas/canvas.service';
import { Users } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
import { Canvas } from '../entities/canvas.entity';
import { decode, encode } from '@msgpack/msgpack';
import Piscina = require('piscina');
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as path from 'path';

const io = new Server();
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
    // private readonly canvasService: CanvasService,
    @Inject(forwardRef(() => CanvasService))
    private readonly canvasService: CanvasService,
    @InjectRepository(Users) private userRepository: Repository<Users>,
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    @InjectRepository(Canvas) private canvasRepository: Repository<Canvas>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.pool = new Piscina({
      filename: path.resolve(__dirname, '../utils/worker-threads.js'),
    });

    console.log('process.env', process.env.NODE_ENV);
  }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: any, ...args: any[]) {
    return true;
  }
  async handleDisconnect(client: any) {
    // 离线的时候socket.io room中会自动移除
    // 更新房间状态
    // 更新成员状态
    const socket = client.id;
    const user = await this.userRepository.findOne({ socket });
    if (!user) {
      console.log('user disconnect error');
      return;
    }
    console.log('handleDisconnect', user);
    client.leave(user.roomId);
    user.status = 'offline';
    await this.userRepository.save(user);

    // 离线三分钟， 清除user
    setTimeout(async () => {
      console.log('socket', client.nsp.sockets.size);
      const user = await this.userRepository.findOne({ socket });
      if (user.status === 'offline') {
        await this.userRepository.remove(user);
        const room = await this.roomRepository.findOne(
          { id: user.roomId },
          { relations: ['users', 'canvas'] },
        );
        if (client.nsp.sockets.size === 0) {
          room.status = 'closed';
          this.roomRepository.save(room);
        }
      }
    }, 3 * 60 * 1000);
    this.logger.log('info', `user ${user.id} 断开 roomId: ${user.roomId}`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(@ConnectedSocket() client: any, @MessageBody() data: any) {
    console.log('joinRoom', data);
    const { roomId = uuidv4(), userId, username = '', pageId } = data;
    console.log('userId', roomId, userId, username);
    this.logger.log(
      'info',
      `joinRoom roomId: ${roomId}, pageId: ${pageId}, userId: ${userId}`,
    );
    this.logger.log('info', `user: ${userId} socket connect`);
    let user = null;
    try {
      user = await this.userRepository.findOne({ id: userId });
    } catch (error) {
      this.logger.error('db error: user.findOne', { id: userId });
    }

    if (user) {
      // 更改user状态
      user.roomId = roomId;
      user.status = 'online';
      user.socket = client.id;
      await this.userRepository.save(user);
      this.logger.log('info', `已存在user ${userId}`);
    } else {
      user = await this.userRepository.save({
        id: userId,
        status: 'online',
        roomId,
        username,
        socket: client.id,
        room: {
          id: roomId,
        },
      });
      console.log('user', user);

      this.logger.log('info', `不存在user ${userId}`);
    }

    // 初始化时pageId为undefined 自动创建画布
    let newPageId = 0;
    if (pageId === 'undefined') {
      const canvas = await this._createCanvas(roomId);
      console.log('pageId === undefined', canvas);
      newPageId = canvas.id;
      client.emit('joinRoom', { pageId: canvas.id, roomId, userId: user.id });
    } else {
      const canvas = await this.canvasRepository.findOne({ id: pageId });
      console.log('=============canvas===========', canvas, pageId);
      if (!canvas) {
        // 自动创建画布
        const canvas = await this._createCanvas(roomId);
        client.emit('joinRoom', { pageId: canvas.id, roomId, userId: user.id });
        this.logger.log(
          'info',
          `创建canvas, roomId${roomId}, user:${userId}, pageId: ${pageId}`,
        );
      } else {
        client.emit('joinRoom', { pageId, roomId, userId: user.id });
      }
    }

    client.join(roomId);
    this.logger.log(
      'info',
      `user: ${userId} join room  roomId:${roomId} pageId: ${
        pageId || newPageId
      }`,
    );
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
    console.log('draw', user);
    if (!user) {
      this.logger.error(`不存在的user, socket.id: ${client.id}, 请先joinRoom`);
      const errMsg = JSON.stringify({
        msg: 'error: need joinRoom',
      });
      client.emit(errMsg);
      // client.disconnect(true);
      return;
    }
    const roomId = user.room.id;
    // 工作线程
    const decryptData = await this.pool.run(data);
    client.to(roomId).emit('syncRoomDraw', data);
    this.canvasService.draw(roomId, decryptData);
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

  // 修改数据库画笔
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

  // 新建白板页广播
  async newWhiteboard(roomId: string, pageId: number, userId: string) {
    this.logger.log(
      'info',
      `userId: ${userId}, roomId: ${roomId} create new Page: ${pageId}`,
    );
    const user = await this.userRepository.findOne({ id: userId });
    this.logger.log('info', `newWhiteboard get user:${JSON.stringify(user)}`);
    const sockets = await this.server.in(roomId).fetchSockets();
    sockets.forEach((socket) => {
      if (socket.id !== user.socket) {
        socket.emit(
          'cmd',
          encode(
            {
              roomId,
              pageId,
              cmd: 'np',
            },
            {},
          ),
        ); // np -> newPage
      }
    });
    console.log('===sockets===', sockets);
  }

  // 创建画布
  private async _createCanvas(roomId) {
    const canvas = await this.canvasRepository.save({
      roomId,
      room: {
        id: roomId,
      },
    });
    return canvas;
  }
}
