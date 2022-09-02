import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';

@Entity()
export class Users {
  @PrimaryColumn()
  id: string;

  @Column({ default: '' })
  username: string | null;

  @Column('enum', { enum: ['online', 'offline'] })
  status: string;

  @Column()
  socket: string;

  @Column({ default: 0 })
  drawTimes: number;

  @Column()
  roomId: string;

  @ManyToOne(() => Room, (room) => room.users, { cascade: true })
  room: Room;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
