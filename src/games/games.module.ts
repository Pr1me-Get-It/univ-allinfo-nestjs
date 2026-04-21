import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GamesRepository } from './games.repository';

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesRepository],
})
export class GamesModule {}
