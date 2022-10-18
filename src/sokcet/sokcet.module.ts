import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventGateway } from './events.gateway';
import { Users } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
import { Canvas } from '../entities/canvas.entity';
// import { RoomsService } from '../rooms/rooms.service';
// import { RoomsModule } from '../rooms/rooms.module';
import { CanvasModule } from '../canvas/canvas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Room, Canvas]),
    forwardRef(() => CanvasModule),
    // RoomsModule,
  ],
  providers: [EventGateway],
  exports: [EventGateway],
})
export class SokcetModule {}
