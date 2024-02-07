import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Canvas } from './canvas.entity';
import { Path } from './path.entity';

@Entity()
export class FabricObject {
  @PrimaryColumn()
  id: string;

  @Index()
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

  @OneToMany(() => Path, (path) => path.object, {
    cascade: ['insert', 'update', 'recover'],
  })
  points: Path[];

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
