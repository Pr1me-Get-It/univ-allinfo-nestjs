import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
