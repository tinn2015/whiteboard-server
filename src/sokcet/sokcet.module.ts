import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventGateway } from './events.gateway';
import { User } from '../entities/user.entity';
// import { RoomsService } from '../rooms/rooms.service';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [RoomsModule, TypeOrmModule.forFeature([User])],
  providers: [EventGateway],
})
export class SokcetModule {}
