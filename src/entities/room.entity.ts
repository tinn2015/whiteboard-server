import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Room {
  @Index()
  @PrimaryColumn()
  id: string;

  // @Column('json')
  // canvas: object;
  @Column({ default: 0 })
  maxOnlineUser: number;

  @Column('enum', { enum: ['living', 'closed'] })
  status: string;

  @OneToMany(() => User, (user) => user.room)
  users: User[];

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
