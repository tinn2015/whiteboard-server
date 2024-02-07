import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { FabricObject } from './fabricObject.entity';
@Entity()
export class Path {
  @PrimaryGeneratedColumn()
  id: string;

  @Index()
  @Column({ unique: false })
  pathId: string;

  @Index()
  @Column({ unique: false })
  pageId: number;

  @Column({ unique: false })
  index: number;

  // @Column('json')
  // pathPoints: any;

  @Column('json')
  point: [];

  @ManyToOne(() => FabricObject, (fabricObject) => fabricObject.points, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  object: FabricObject;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
