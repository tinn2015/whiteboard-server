import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Room } from '../entities/room.entity';
import { Users } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Users])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
