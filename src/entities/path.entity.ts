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

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createDate: string;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updateDate: string;
}
