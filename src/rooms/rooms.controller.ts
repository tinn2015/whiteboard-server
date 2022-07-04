import { Controller, Get, Query, Post } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { GetRoomDto } from './dto/get-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  getRoom(@Query() query: GetRoomDto): string {
    return this.roomsService.getRoom(query.roomId, query.userId);
  }
}
