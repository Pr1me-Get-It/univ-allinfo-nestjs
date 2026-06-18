import { UUIDTransformer } from '../../common/transformers/uuid.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_apple_refresh_tokens')
export class UserAppleRefreshToken {
  @PrimaryColumn({
    name: 'user_id',
    type: 'binary',
    length: 16,
    transformer: new UUIDTransformer(),
  })
  userId: string;

  @Column({
    name: 'apple_refresh_token',
    type: 'varchar',
    length: 512,
    nullable: false,
  })
  appleRefreshToken: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @OneToOne(() => User, (user) => user.appleRefreshToken, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
