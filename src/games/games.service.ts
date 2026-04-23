import { Injectable } from '@nestjs/common';
import { GamesRepository } from './games.repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { GameType } from './enums/game-type.enum';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class GamesService {
  private readonly MAX_TIMESTAMP = 9999999999999;
  private readonly TIME_DENOMINATOR = 10000000000000;

  constructor(
    private readonly gamesRepository: GamesRepository,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async updateHighestScore(userId: string, gameType: GameType, score: number) {
    const redisKey = `rangking:${gameType}`;

    const now = Date.now();
    const timeFraction = (this.MAX_TIMESTAMP - now) / this.TIME_DENOMINATOR;

    const finalScore = score + timeFraction;
    await this.redis.zadd(redisKey, 'GT', finalScore, userId);
  }

  async getTopRankings(gameType: GameType, limit = 10) {
    const redisKey = `rangking:${gameType}`;
    const rawRankings = await this.redis.zrevrange(
      redisKey,
      0,
      limit - 1,
      'WITHSCORES',
    );

    const rankings: { userId: string; score: number }[] = [];
    for (let i = 0; i < rawRankings.length; i += 2) {
      rankings.push({
        userId: rawRankings[i],
        score: parseInt(rawRankings[i + 1], 10),
      });
    }

    return rankings;
  }

  async getMyRank(userId: string, gameType: GameType) {
    const redisKey = `rangking:${gameType}`;

    const rankIndex = await this.redis.zrevrank(redisKey, userId);
    return rankIndex !== null ? rankIndex + 1 : null;
  }

  async bufferScoreLog(userId: string, gameType: GameType, score: number) {
    const logData = {
      userId,
      gameType,
      score,
      playAt: new Date().toISOString(),
    };

    await this.redis.rpush('buffer:score-logs', JSON.stringify(logData));
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async flushScoreLogs() {
    const length = await this.redis.llen('buffer:score-logs');
    if (length === 0) return;

    const rawLogs = await this.redis.lrange('buffer:score-logs', 0, -1);
    await this.redis.ltrim('buffer:score-logs', length, -1); // 버퍼 비워

    const entitiesToInsert = rawLogs.map((log) => JSON.parse(log));
    await this.gamesRepository.insert(entitiesToInsert);

    console.log(
      `[Batch] Flushed ${entitiesToInsert.length} score logs to the database.`,
    );
  }
}
