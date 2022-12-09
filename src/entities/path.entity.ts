import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity()
export class Path {
  @Index()
  @PrimaryColumn({})
  pathId: string;

  @Column({ unique: false })
  pageId: number;

  @Column('json')
  pathPoints: any;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
