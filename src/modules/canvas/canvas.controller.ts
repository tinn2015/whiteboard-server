import { Controller, Param, Body } from '@nestjs/common';
import { Get, Post, Delete } from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { CreateCanvasDto } from './dto/create-canvas.dto';
import { DeleteCanvasDto } from './dto/delete-canvas.dto';
import { UploadCanvasDto } from './dto/upload-canvas.dto';
import { GetObjectsDto } from './dto/get-object.dto';
import { ApiCreatedResponse, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('canvas')
@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get(':roomId/:pageId')
  @ApiOperation({ description: '获取指定画布的数据' })
  @ApiCreatedResponse({
    status: 200,
    content: { json: { example: [] } },
  })
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
  uploadCanvas(@Body() uploadCanvasDto: UploadCanvasDto) {
    return this.canvasService.uploadCanvas(uploadCanvasDto);
  }

  // 上传数据到画布
  @Post('getObjects')
  getObjects(@Body() getObjectsDto: GetObjectsDto) {
    return this.canvasService.getObjects(getObjectsDto);
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
