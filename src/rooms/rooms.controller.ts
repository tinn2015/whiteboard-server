import {
  Controller,
  Get,
  Query,
  Post,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { GetRoomDto } from './dto/get-room.dto';
import { DeleteRoomDto } from './dto/delete-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  getRooms() {
    return this.roomsService.getRooms();
  }

  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.roomsService.getRoom(id);
  }

  @Delete()
  deleteCanvas(@Body() deleteRoomDto: DeleteRoomDto) {
    return this.roomsService.deleteRoom(deleteRoomDto);
  }
}
