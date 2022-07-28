import { Module } from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Canvas } from '../entities/canvas.entity';
import { FabricObject } from '../entities/fabricObject.entity';
// import { Logger } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([Canvas, FabricObject])],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService],
})
export class CanvasModule {}
