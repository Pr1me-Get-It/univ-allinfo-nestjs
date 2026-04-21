import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GameScoreLog } from './entities/game-score-log.entity';
import { DataSource } from 'typeorm/browser';

@Injectable()
export class GamesRepository extends Repository<GameScoreLog> {
  constructor(dataSource: DataSource) {
    super(GameScoreLog, dataSource.manager);
  }
}
