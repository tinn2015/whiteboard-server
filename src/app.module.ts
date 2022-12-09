import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsModule } from './modules/rooms/rooms.module';
import { UsersModule } from './modules/users/users.module';
import { SokcetModule } from './modules/sokcet/sokcet.module';
import { PathModule } from './modules/path/path.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CanvasModule } from './modules/canvas/canvas.module';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import 'winston-daily-rotate-file';
import * as winston from 'winston';
import envConfig from './common/config';
import * as Joi from '@hapi/joi';
console.log('====envConfig====', envConfig());
@Module({
  imports: [
    // 环境配置
    // ConfigModule.forRoot({
    //   // 验证环境配置
    //   validationSchema: Joi.object({
    //     NODE_ENV: Joi.required().default('development'),
    //   }),
    // }),
    ConfigModule.forRoot({
      isGlobal: true, // 作用于全局
      load: [envConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('DATABASE_SYNC'), // orm 每次都会同步到数据库。 生产环境禁用
        logging: configService.get('DATABASE_LOGGING'),
      }),
      inject: [ConfigService],
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
    RoomsModule,
    UsersModule,
    SokcetModule,
    CanvasModule,
    PathModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
