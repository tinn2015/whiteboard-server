import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from './user.entity';
import { Canvas } from './canvas.entity';

@Entity()
export class Room {
  @PrimaryColumn()
  id: string;

  @OneToMany(() => Canvas, (canvas) => canvas.room)
  canvas: Canvas[];

  @Column({ default: 0 })
  maxOnlineUser: number;

  @Column('enum', { enum: ['living', 'closed'], default: 'living' })
  status: string;

  @OneToMany(() => Users, (user) => user.room)
  users: Users[];

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
