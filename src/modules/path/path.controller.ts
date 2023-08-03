import {
  Controller,
  Get,
  Query,
  Post,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { PathService } from './path.service';
import { GetPathDto } from './dto/get-path.dto';
import { addPathDto } from './dto/add-path.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('paths')
@Controller('paths')
export class PathController {
  constructor(private readonly pathService: PathService) {}

  /**
   * 通过path的oid获取path轨迹
   * @param id
   * @returns
   */
  @Post('/getPath')
  getPath(@Body() getPathDto: GetPathDto) {
    return this.pathService.getPath(getPathDto);
  }

  @Post('/uploadPath')
  uploadPath(@Body() addPathDtos: addPathDto[]) {
    return this.pathService.addPaths(addPathDtos);
  }
}
