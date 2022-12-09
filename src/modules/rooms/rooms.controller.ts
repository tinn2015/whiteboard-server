import { Controller, Get, Post, Param, Delete, Body } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { DeleteRoomDto } from './dto/delete-room.dto';
import { UpdateCurrentPageDto } from './dto/update-page.dto';

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

  @Post('/updateCurrentPage')
  updateCurrentPage(@Body() updateCurrentPageDto: UpdateCurrentPageDto) {
    return this.roomsService.updateCurrentPage(updateCurrentPageDto);
  }

  @Delete()
  deleteCanvas(@Body() deleteRoomDto: DeleteRoomDto) {
    return this.roomsService.deleteRoom(deleteRoomDto);
  }
}
