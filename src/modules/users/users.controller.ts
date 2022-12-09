import { Controller, Get, Query, Post, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }
}
