import { UUIDTransformer } from '@src/common/transformers/uuid.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameType } from '../enums/game-type.enum';

@Entity('game_score_logs')
export class GameScoreLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({
    name: 'user_id',
    type: 'binary',
    length: 16,
    nullable: false,
    transformer: new UUIDTransformer(),
  })
  userId!: string;

  @Column({ name: 'game_type', type: 'enum', enum: GameType, nullable: false })
  gameType!: GameType;

  @Column({ type: 'int', nullable: false })
  score!: number;

  @CreateDateColumn({ name: 'played_at' })
  playedAt!: Date;
}
