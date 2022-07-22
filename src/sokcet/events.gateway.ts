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
import { decode } from '@msgpack/msgpack';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
// import { default as Pa } from 'piscina';
import Piscina = require('piscina');
import * as path from 'path';
// import { drawCanvas } from '../utils/worker-threads';

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
  constructor(private readonly roomsService: RoomsService) {
    this.worker.on('message', (data) => {
      console.log(data);
    });
    console.log('Pa', Piscina);
    this.pool = new Piscina({
      // The URL must be a file:// URL
      filename: path.resolve(__dirname, '../utils/worker-threads.js'),
    });
  }
  private readonly socketMapRoom = new Map();
  private worker = new Worker('./dist/utils/worker-threads.js', {
    workerData: { nn: 11 },
  });

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
    const { roomId } = this.socketMapRoom.get(client.id);
    // console.log('draw data', decode(data));
    // const worker = new Worker(__filename, { workerData: data });
    // this.worker.postMessage({ workerData: data });
    this.pool.run({ a: 1, b: 2 });

    // drawCanvas(data);
    client.to(roomId).emit('sync', data);
  }

  @SubscribeMessage('cmd')
  handleCmd(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const { roomId } = this.socketMapRoom.get(client.id);
    client
      .to(roomId)
      .emit('cmd', { msg: '我是server, 这是我广播的cmd', ...data });
  }
}
