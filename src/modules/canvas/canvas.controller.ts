import { Controller, Param, Body } from '@nestjs/common';
import { Get, Post, Delete } from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { CreateCanvasDto } from './dto/create-canvas.dto';
import { DeleteCanvasDto } from './dto/delete-canvas.dto';
import { UploadCanvasDto } from './dto/upload-canvas.dto';

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get(':roomId/:pageId')
  getFabricData(
    @Param('roomId') roomId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.canvasService.getFabricData(roomId, +pageId);
  }

  @Post()
  createCanvas(@Body() createCanvasDto: CreateCanvasDto) {
    return this.canvasService.createCanvas(createCanvasDto);
  }

  // 上传数据到画布
  @Post('upload')
  uploadCanvas(@Body() createCanvasDto: UploadCanvasDto) {
    return this.canvasService.uploadCanvas(createCanvasDto);
  }

  /**
   * 删除画布
   * @param deleteCanvasDto
   * @returns
   */
  @Delete()
  deleteCanvas(@Body() deleteCanvasDto: DeleteCanvasDto) {
    return this.canvasService.deleteCanvas(deleteCanvasDto);
  }
}
