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
import { Users } from '../../entities/user.entity';
import { Room } from '../../entities/room.entity';
import { Canvas } from '../../entities/canvas.entity';
import { decode, encode } from '@msgpack/msgpack';
import Piscina = require('piscina');
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { signAesDecrypt } from '../../utils/decrypt';
import * as CONTANTS from '../../common/constants';
import * as path from 'path';

const io = new Server();
@WebSocketGateway(80, {
  cors: {
    origin: '*',
  },
  pingInterval: 2500,
  pingTimeout: 2000,
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
  // 缓存某个房间的timer，用于保证room中的画布一致
  private roomTimerCache: Map<string, NodeJS.Timeout>;
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
      filename: path.resolve(__dirname, '../../utils/worker-threads.js'),
      idleTimeout: 5000, // 不执行任务时5秒后关闭该线程， 避免频繁开启关系线程
    });
    this.roomTimerCache = new Map();
    console.log('process.env', process.env.NODE_ENV);
  }

  @WebSocketServer()
  server: Server;
  async handleConnection(client: any, ...args: any[]) {
    const random = client.handshake.headers['x-qn-wb-random'];
    const signature = client.handshake.headers['x-qn-wb-signature'];
    if (!signature || !random) {
      this.logger.error(
        'websocket 请求头不存在 x-qn-wb-random | x-qn-wb-signature',
      );
      return;
    }
    const decryptedData = signAesDecrypt(signature);
    if (random !== decryptedData) {
      client.emit('error', `403 forbidden`);
      client.disconnect();
    }
    return true;
  }
  async handleDisconnect(client: any) {
    // 离线的时候socket.io room中会自动移除
    // 更新房间状态
    // 更新成员状态

    const socket = client.id;
    const user = await this.userRepository.findOne({ socket });
    // if (!user) {
    //   console.log('user disconnect error');
    //   return;
    // }
    // console.log('handleDisconnect', user);
    // client.leave(user.roomId);
    // user.status = 'offline';
    // await this.userRepository.save(user);

    // // 离线三分钟， 清除user
    // setTimeout(async () => {
    //   console.log('socket', client.nsp.sockets.size);
    //   const user = await this.userRepository.findOne({ socket });
    //   if (user && user.status === 'offline') {
    //     await this.userRepository.remove(user);
    //     const room = await this.roomRepository.findOne(
    //       { id: user.roomId },
    //       { relations: ['users', 'canvas'] },
    //     );
    //     // 更新房间状态
    //     if (client.nsp.sockets.size === 0) {
    //       room.status = 'closed';
    //       this.roomRepository.save(room);
    //     }
    //   }
    // }, 3 * 60 * 1000);

    // this.logger.log('info', `user ${user.id} 断开 roomId: ${user.roomId}`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(@ConnectedSocket() client: any, @MessageBody() data: any) {
    console.log('joinRoom', data);
    const { roomId = uuidv4(), userId, username = '' } = data;
    console.log('userId', roomId, userId, username);
    this.logger.log('info', `joinRoom roomId: ${roomId}, userId: ${userId}`);
    this.logger.log('info', `user: ${userId} socket connect`);

    // 判断room是否存在，存在则返回当前room下的所有page, 不存在则创建room和创建page
    const room = await this.roomRepository.findOne(roomId);
    console.log(`joinroom roomId: ${roomId}`, room);
    if (!room) {
      // 自动创建画布
      const canvas = await this._createCanvas(roomId);
      console.log('====create canvas====', canvas);
      client.emit('joinRoom', { pages: [canvas.id], roomId });
    } else {
      const roomInfo = await this.roomRepository.findOne(roomId, {
        relations: ['canvas'],
      });
      const pages = roomInfo.canvas.map((i) => {
        return i.id;
      });
      console.log('====roomInfo====', roomInfo);
      client.emit('joinRoom', { pages, roomId });
    }

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

    client.join(roomId);
  }

  @SubscribeMessage('draw')
  async handleEvent(@ConnectedSocket() client: any, @MessageBody() data: any) {
    // const user = null;
    const { rid: roomId } = data;
    client.to(roomId).emit('syncRoomDraw', data.draw);
    // 工作线程
    // const decryptData = await this.pool.run(data.draw);
    const decryptData = decode(data.draw);
    this.canvasService.draw(roomId, decryptData);
    this.syncPageObject(decryptData, client, roomId);
  }

  /**
   * 新增到数据库， 无需广播
   */
  @SubscribeMessage('add')
  async handleAdd(@ConnectedSocket() client: any, @MessageBody() data: any) {
    // const user = null;
    const { rid: roomId } = data;
    // 工作线程
    // const decryptData = await this.pool.run(data.draw);
    const decryptData = decode(data.draw);
    this.canvasService.draw(roomId, decryptData);
  }

  @SubscribeMessage('cmd')
  async handleCmd(@ConnectedSocket() client: any, @MessageBody() data: any) {
    const { rid: roomId } = data;
    client.to(roomId).emit('cmd', data.cmd);
    // 工作线程
    const decryptData = await this.pool.run(data.cmd);
    this.canvasService.cmdHandle(roomId, decryptData);
    this.syncPageObject(decryptData, client, roomId);
  }

  // 修改数据库画笔
  @SubscribeMessage('ms')
  async toServe(@ConnectedSocket() client: any, @MessageBody() data: any) {
    const { rid: roomId } = data;
    // 工作线程
    const decryptData = await this.pool.run(data.ms);
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
    sockets &&
      sockets.forEach((socket) => {
        if (socket.id !== user.socket) {
          socket.emit(
            'cmd',
            encode(
              {
                roomId,
                pid: pageId,
                cmd: 'np', // np -> newPage
              },
              {},
            ),
          );
        }
      });
  }

  // 删除白板页广播
  async removeWhiteboard(roomId: string, pageId: number, userId: string) {
    this.logger.log(
      'info',
      `userId: ${userId}, roomId: ${roomId} create new Page: ${pageId}`,
    );
    const user = await this.userRepository.findOne({ id: userId });
    this.logger.log(
      'info',
      `removeWhiteboard get user:${JSON.stringify(user)}`,
    );
    const sockets = await this.server.in(roomId).fetchSockets();
    sockets &&
      sockets.forEach((socket) => {
        if (socket.id !== user.socket) {
          socket.emit(
            'cmd',
            encode(
              {
                roomId,
                pid: pageId,
                cmd: 'rp', // rp -> removePage
              },
              {},
            ),
          );
        }
      });
    console.log('===sockets===', sockets);
  }

  // 通知拉取指定页数据
  async notifyPullCanvasById(roomId: string, pageId: number, userId: string) {
    this.logger.log(
      'info',
      `userId: ${userId}, roomId: ${roomId} create new Page: ${pageId}`,
    );
    const user = await this.userRepository.findOne({ id: userId });
    this.logger.log(
      'info',
      `notifyPullCanvasById get user:${JSON.stringify(user)}`,
    );
    const sockets = await this.server.in(roomId).fetchSockets();
    sockets &&
      sockets.forEach((socket) => {
        if (socket.id !== user.socket) {
          socket.emit(
            'cmd',
            encode(
              {
                roomId,
                pid: pageId,
                cmd: 'gp', // gp -> getPage
              },
              {},
            ),
          );
        }
      });
  }

  // 创建画布
  private async _createCanvas(roomId) {
    const canvas = await this.canvasRepository.save({
      roomId,
      room: {
        id: roomId,
      },
    });
    const room = await this.roomRepository.findOne({ id: roomId });
    room.currentPage = canvas.id;
    await this.roomRepository.save(room);
    return canvas;
  }

  private syncPageObject(data: any, client: any, roomId: string) {
    // 获取一个画布上的所有oid
    const pid = (data.qn && data.qn.pid) || data.pid;
    const t = data.qn ? data.qn.t : '';
    if (t === CONTANTS.DRAW_FREE_PATHS) return;
    const timer = this.roomTimerCache.get(pid);
    if (timer) {
      clearTimeout(timer);
    }
    const curTimer = setTimeout(async () => {
      const oids = await this.canvasService.getAllObjectIds(pid);
      const encodeData = encode({ pid, oids });
      client.to(roomId).emit('revise', encodeData);
      client.emit('revise', encodeData);
    }, 2000);
    this.roomTimerCache.set(pid, curTimer);
  }
}
