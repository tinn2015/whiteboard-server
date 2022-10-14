import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { Users } from '../entities/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

// import { Room } from './interfaces/rooms.interface'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users) private userRepository: Repository<Users>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  private readonly rooms = new Map();

  getUsers() {
    return this.userRepository.find();
  }

  getUser(id: string) {
    console.log('getRoom', id);
    return this.userRepository.findOne({ id });
  }

  async batchDeletaUser(userIds: string[], roomId: string) {
    const users = await this.userRepository.findByIds(userIds);
    if (users && users.length) {
      await this.userRepository.remove(users);
      this.logger.log(
        'info',
        `batch delete user ids: ${userIds} success, room: ${roomId}`,
      );
    }
  }
}
