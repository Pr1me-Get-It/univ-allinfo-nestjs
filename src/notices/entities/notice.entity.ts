import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notices')
@Index('IDX_NOTICE_SOURCE', ['source'])
export class Notice {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  source!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: false })
  url!: string;

  @Column({ name: 'posted_at', type: 'timestamp', nullable: false })
  postedAt!: Date;

  @Column({ type: 'int', nullable: false, default: 0 })
  views!: number;

  @Column({ type: 'timestamp', nullable: true })
  kickoff!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deadline!: Date | null;

  @Column({
    name: 'hashed_url',
    type: 'varchar',
    length: 64,
    unique: true,
    nullable: false,
  })
  hashedUrl!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
