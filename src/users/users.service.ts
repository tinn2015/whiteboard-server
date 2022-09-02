import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { Users } from '../entities/user.entity';

// import { Room } from './interfaces/rooms.interface'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users) private userRepository: Repository<Users>,
  ) {}
  private readonly rooms = new Map();

  getUsers() {
    return this.userRepository.find();
  }

  getUser(id: string) {
    console.log('getRoom', id);
    return this.userRepository.findOne({ id });
  }
}
