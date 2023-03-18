/* eslint-disable @typescript-eslint/no-var-requires */
const fetch = require('node-fetch');
const { io } = require('socket.io-client');
const { path1, path2, path3 } = require('./mockData');
const { encode, decode } = require('@msgpack/msgpack');

const CONFIG = {
  // roomId: '711249703',
  // pageId: 118,
  roomId: '111',
  pageId: 9,
  socketUrl: 'ws://localhost:80', // local
  // socketUrl: 'ws://localhost:80',
  // socketUrl: 'ws://172.25.9.11:3030/', // dev
  participants: [
    {
      userId: '11212122',
      method: 'drawPath',
      drawObj: path1,
      socket: '',
      interval: 1000,
    },
    {
      userId: '1333333333',
      method: 'drawPath',
      drawObj: path2,
      socket: '',
      interval: 1500,
    },
    {
      userId: '14444444444',
      method: 'drawPath',
      drawObj: path3,
      socket: '',
      interval: 2000,
    },
  ],
};

// 创建连接
_getConnect().then(() => {
  // 开始绘制
  console.log('开始绘制');
  _mockUserHandle();
});

function _mockUserHandle() {
  for (let i = 0; i < CONFIG.participants.length; i++) {
    const participant = CONFIG.participants[i];
    switch (participant.method) {
      case 'drawPath':
        if (participant.interval) {
          setInterval(() => {
            _drawPath(participant);
          }, participant.interval);
        } else {
          _drawPath(participant);
        }
        break;
      default:
        console.error('[不存在]participant.method', participant.method);
    }
  }
}

function _getConnect() {
  return new Promise((resolve, reject) => {
    CONFIG.participants.forEach((user, index) => {
      setTimeout(() => {
        const socket = io(CONFIG.socketUrl);
        user.socket = socket;
        socket.on('connect', () => {
          console.log('socket connect success');
          socket.emit('joinRoom', {
            roomId: String(CONFIG.roomId),
            userId: user.userId,
            username: '',
          });
        });
        socket.on('joinRoom', (res) => {
          if (index === CONFIG.participants.length - 1) {
            console.log('joinRoom success', res);
            resolve();
          }
        });
      }, parseInt(Math.random() * 10));
    });
  });
}

// 绘制path
function _drawPath(participant) {
  const { drawObj, socket } = participant;
  const { points, qn, options } = drawObj;
  const oid = guid();
  points.forEach((point, index) => {
    qn.pid = CONFIG.pageId;
    qn.oid = oid;
    const fpObj = {
      index,
      path: point,
      qn,
    };
    const encodeData = encode(fpObj, {
      maxDepth: 10,
    });
    const syncObj = {
      rid: CONFIG.roomId,
      draw: encodeData,
    };
    participant.socket.emit('draw', syncObj);
  });

  const offset = parseInt(Math.random() * 10);
  options.top += offset;
  options.left += offset;
  options.qn.pid = CONFIG.pageId;
  options.qn.oid = oid;
  console.log('object', options);
  const encodeData = encode(options, {
    maxDepth: 10,
  });
  const pathObj = {
    rid: CONFIG.roomId,
    draw: encodeData,
  };
  participant.socket.emit('draw', pathObj);
}

function guid() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return S4() + S4();
}
