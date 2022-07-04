import { Module } from '@nestjs/common';
import { EventGateway } from './events.gateway';
// import { RoomsService } from '../rooms/rooms.service';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [RoomsModule],
  providers: [EventGateway],
})
export class SokcetModule {}
