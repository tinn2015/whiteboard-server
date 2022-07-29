import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Canvas } from './canvas.entity';

@Entity()
export class FabricObject {
  @Index()
  @PrimaryColumn()
  id: string;

  @Column('json')
  object: object;

  @ManyToOne(() => Canvas, (canvas) => canvas.objects, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  canvas: object;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
