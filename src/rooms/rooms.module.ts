import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { Canvas } from '../entities/canvas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, User, Canvas])],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
