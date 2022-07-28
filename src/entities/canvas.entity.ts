import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { FabricObject } from './fabricObject.entity';

@Entity()
export class Canvas {
  @Index()
  @PrimaryColumn()
  roomId: string;

  @Column('json', { default: { background: '#262626' } })
  cProps: { background: string };

  @Column('json', { default: [] })
  objectIds: string[];

  @OneToMany(() => FabricObject, (fabricObject) => fabricObject.canvas)
  objects: object;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
