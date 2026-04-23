import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { GameScoreLog } from './entities/game-score-log.entity';

@Injectable()
export class GamesRepository extends Repository<GameScoreLog> {
  constructor(dataSource: DataSource) {
    super(GameScoreLog, dataSource.manager);
  }
}
