import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';
import { SokcetModule } from './sokcet/sokcet.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CanvasModule } from './canvas/canvas.module';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import 'winston-daily-rotate-file';
import * as winston from 'winston';
import * as Joi from '@hapi/joi';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: +process.env.DATABASE_PORT,
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        autoLoadEntities: true,
        synchronize: true, // orm 每次都会同步到数据库。 生产环境禁用
      }),
    }),
    // 日志模块
    WinstonModule.forRoot({
      exitOnError: false,
      //这里的format是通用配置
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('white-board', {
          prettyPrint: true,
        }),
        //关闭颜色一定放在最后一项，否则上面的nestWinstonModuleUtilities会打开颜色
        // winston.format.uncolorize()
      ),
      transports: [
        new winston.transports.Console({
          //这里的format如果有配置会重写上面的format
          format: winston.format.combine(),
        }),
        new winston.transports.DailyRotateFile({
          format: winston.format.combine(
            //这里重写关闭颜色，否则写入文件会乱码
            winston.format.uncolorize(),
          ),
          filename: './logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    }),
    ConfigModule.forRoot({
      // 验证环境配置
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.required(),
        DATABASE_PORT: Joi.number().default(5432),
      }),
    }),
    RoomsModule,
    UsersModule,
    SokcetModule,
    CanvasModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
