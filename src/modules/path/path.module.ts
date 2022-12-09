import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Path } from '../../entities/path.entity';
import { PathController } from './path.controller';
import { PathService } from './path.service';

@Module({
  imports: [TypeOrmModule.forFeature([Path])],
  controllers: [PathController],
  providers: [PathService],
  exports: [PathService],
})
export class PathModule {}
