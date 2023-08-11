import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthorityGuard } from './common/guards/authority.guard';
import { QueryFailedExceptionFilter } from './common/filters/typeorm-exception.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { json } from 'body-parser';
import * as compression from 'compression';
import { RedisIOAdapter, getAdapter } from './modules/redis/redisIoAdapter';
import { ConfigService } from '@nestjs/config';
// import {
//   WinstonModule,
//   utilities as nestWinstonModuleUtilities,
// } from 'nest-winston';
// import 'winston-daily-rotate-file';
// import * as winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    abortOnError: false,
  });

  const nestWinston = app.get(WINSTON_MODULE_NEST_PROVIDER);

  // 设置响应头， 添加一些常规的安全配置
  // app.use(
  //   helmet({
  //     crossOriginOpenerPolicy: false,
  //   }),
  // );

  //
  // const configService = app.get(ConfigService);
  // getAdapter(
  //   configService.get('REDIS_HOST'),
  //   configService.get('REDIS_PORT'),
  //   configService.get('REDIS_PASSWORD'),
  // );
  // app.useWebSocketAdapter(new RedisIOAdapter(app));

  // gzip 压缩
  app.use(compression());

  // public
  app.useStaticAssets('whiteboard-web');

  // 解除默认request payload的限制问题
  app.use(json({ limit: '50mb' }));

  // 全局logger
  app.useLogger(nestWinston);

  // 对http 请求 响应做拦截处理
  app.useGlobalFilters(new HttpExceptionFilter(nestWinston.logger));

  // app.useGlobalFilters(new QueryFailedExceptionFilter(nestWinston.logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 确保无效的属性都会被剥离或者删除
      forbidNonWhitelisted: true, // 存在非白名单属性时停止处理请求选项， 抛出错误
      transform: true,
    }),
  );

  app.useGlobalGuards(new AuthorityGuard());

  await app.listen(3000);
}
bootstrap();
