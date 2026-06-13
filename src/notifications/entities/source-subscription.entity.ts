import { UUIDTransformer } from '@src/common/transformers/uuid.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('source_subscriptions')
@Unique(['userId', 'source'])
export class SourceSubscription {
  @PrimaryGeneratedColumn({
    name: 'id',
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    name: 'user_id',
    type: 'binary',
    length: 16,
    transformer: new UUIDTransformer(),
  })
  userId!: string;

  @Column({ name: 'source', type: 'varchar', length: 64, nullable: false })
  source!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.sourceSubscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
