import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsModule } from './rooms/rooms.module';
import { SokcetModule } from './sokcet/sokcet.module';

@Module({
  imports: [RoomsModule, SokcetModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
