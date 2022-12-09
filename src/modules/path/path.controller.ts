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

@Controller('paths')
export class PathController {
  constructor(private readonly pathService: PathService) {}

  /**
   * 通过path的oid获取path轨迹
   * @param id
   * @returns
   */
  @Post('/getPath')
  getRoom(@Body() getPathDto: GetPathDto) {
    return this.pathService.getPath(getPathDto);
  }
}
