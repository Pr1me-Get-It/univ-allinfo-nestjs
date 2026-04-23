import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GamesRepository } from './games.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameScoreLog } from './entities/game-score-log.entity';
import { UsersModule } from '@src/users/users.module';
import { AuthModule } from '@src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GameScoreLog]), UsersModule, AuthModule],
  controllers: [GamesController],
  providers: [GamesService, GamesRepository],
})
export class GamesModule {}
