import { UUIDTransformer } from '@src/common/transformers/uuid.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('expo_tokens')
export class ExpoToken {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({
    name: 'user_id',
    type: 'binary',
    length: 16,
    transformer: new UUIDTransformer(),
  })
  userId: string;

  @Column({
    name: 'expo_push_token',
    type: 'varchar',
    length: 512,
    nullable: false,
    unique: true,
  })
  expoPushToken: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.expoTokens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
