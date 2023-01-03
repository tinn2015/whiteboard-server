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
  @PrimaryColumn()
  id: string;

  @Column()
  pageId: number;

  @Column()
  type: string;

  @Column({ default: false })
  isCleared: boolean;

  @Column('json')
  object: any;

  @ManyToOne(() => Canvas, (canvas) => canvas.objects, {
    cascade: true,
  })
  canvas: object;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
