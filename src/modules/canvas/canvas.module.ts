import { Module, forwardRef } from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Canvas } from '../../entities/canvas.entity';
import { Room } from '../../entities/room.entity';
import { FabricObject } from '../../entities/fabricObject.entity';
import { SokcetModule } from '../sokcet/sokcet.module';
import { RoomsModule } from '../rooms/rooms.module';
import { PathModule } from '../path/path.module';
// import { Logger } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([Canvas, FabricObject, Room]),
    forwardRef(() => SokcetModule), // forwardRef 解决循环依赖
    forwardRef(() => RoomsModule),
    PathModule,
  ],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService],
})
export class CanvasModule {}
