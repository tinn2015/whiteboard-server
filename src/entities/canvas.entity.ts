import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Users } from './user.entity';
import { Room } from './room.entity';
import { FabricObject } from './fabricObject.entity';

@Entity()
export class Canvas {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: string;

  @ManyToOne(() => Room, (room) => room.canvas, { cascade: true })
  room: Room;

  @Column('json', { default: { background: '#262626' } })
  cProps: { background: string; backgroundImage: null | string };

  @Column('json', { default: [] })
  objectIds: string[];

  @OneToMany(() => FabricObject, (fabricObject) => fabricObject.canvas)
  objects: object;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
