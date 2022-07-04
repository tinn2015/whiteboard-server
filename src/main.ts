import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // public
  app.useStaticAssets('whiteboard-web');
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
