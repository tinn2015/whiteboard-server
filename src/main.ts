import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { QueryFailedExceptionFilter } from './common/filters/typeorm-exception.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as compression from 'compression';
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

  // gzip 压缩
  app.use(compression());

  // public
  app.useStaticAssets('whiteboard-web');

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
  await app.listen(3000);
}
bootstrap();
