import { Module, forwardRef } from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Canvas } from '../entities/canvas.entity';
import { FabricObject } from '../entities/fabricObject.entity';
import { SokcetModule } from '../sokcet/sokcet.module';
// import { Logger } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([Canvas, FabricObject]),
    forwardRef(() => SokcetModule), // forwardRef 解决循环依赖
  ],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService],
})
export class CanvasModule {}
