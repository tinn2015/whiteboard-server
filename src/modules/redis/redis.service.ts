import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CHANNEL_WB_DRAW, CHANNEL_WB_CMD } from '../../common/constants';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

export interface RedisOptions {
  host: string;
  port: string;
  password: string;
}

@Injectable()
export class RedisService {
  redisClient: Redis;
  redisSubClient: Redis;
  constructor(
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.redisClient = new Redis({
      port: configService.get('REDIS_PORT'), // Redis port
      host: configService.get('REDIS_HOST'), // Redis host
      password: configService.get('REDIS_PASSWORD'),
    });
    this.redisSubClient = new Redis({
      port: configService.get('REDIS_PORT'), // Redis port
      host: configService.get('REDIS_HOST'), // Redis host
      password: configService.get('REDIS_PASSWORD'),
    });

    // 订阅消息
    this.redisSubClient.subscribe(
      CHANNEL_WB_DRAW,
      CHANNEL_WB_CMD,
      (err, count) => {
        if (err) {
          console.error('订阅错误:', err);
        } else {
          console.log(`成功订阅 ${count} 个频道`);
        }
      },
    );

    this.redisSubClient.on('message', (channel, message) => {
      console.log(`接收到来自频道 ${channel} 的消息：${message}`);
    });
  }

  //   set() {}

  /**
   * 白板画笔事件 发布
   */
  drawPublish(data) {
    this.redisClient.publish(CHANNEL_WB_DRAW, data);
    this.logger.log('info', `redis drawPublish`);
  }
}
