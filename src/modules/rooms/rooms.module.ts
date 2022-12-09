import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { CanvasModule } from '../canvas/canvas.module';
import { UsersModule } from '../users/users.module';
import { Room } from '../../entities/room.entity';
import { Users } from '../../entities/user.entity';
import { Canvas } from '../../entities/canvas.entity';

@Module({
  imports: [
    forwardRef(() => CanvasModule),
    TypeOrmModule.forFeature([Room, Users, Canvas]),
    UsersModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
