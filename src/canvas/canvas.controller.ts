import { Controller, Param } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { CanvasService } from './canvas.service';

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get(':roomId')
  getFabricData(@Param('roomId') roomId: string) {
    return this.canvasService.getFabricData(roomId);
  }
}
