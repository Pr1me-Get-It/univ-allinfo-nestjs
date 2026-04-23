import { Injectable } from '@nestjs/common';
import { GamesRepository } from './games.repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { GameType } from './enums/game-type.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { College } from '@src/users/enums/college.enum';
import { Department } from '@src/users/enums/department.enum';
import { OnEvent } from '@nestjs/event-emitter';
import { UsersService } from '@src/users/users.service';

@Injectable()
export class GamesService {
  private readonly MAX_TIMESTAMP = 9999999999999;
  private readonly TIME_DENOMINATOR = 10000000000000;

  constructor(
    private readonly gamesRepository: GamesRepository,
    @InjectRedis() private readonly redis: Redis,
    private readonly usersService: UsersService,
  ) {}

  private async getUserProfileCache(userId: string) {
    const profileStr = await this.redis.hget('user:profiles', userId);
    if (profileStr) {
      return JSON.parse(profileStr);
    }

    const userProfile = await this.usersService.findProfileById(userId);
    if (!userProfile) return null;

    const profile = {
      nickname: userProfile.nickname,
      college: userProfile.college ?? College.OTHER,
      department: userProfile.department ?? Department.OTHERS,
    };

    await this.redis.hset('user:profiles', userId, JSON.stringify(profile));
    return profile;
  }

  async updateHighestScore(userId: string, gameType: GameType, score: number) {
    const globalKey = `ranking:${gameType}:global`;

    const profile = await this.getUserProfileCache(userId);
    if (!profile) return;
    const college = profile.college || College.OTHER;
    const department = profile.department || Department.OTHERS;

    const timeFraction =
      (this.MAX_TIMESTAMP - Date.now()) / this.TIME_DENOMINATOR;
    const finalScore = score + timeFraction;

    const oldScoreStr = await this.redis.zscore(globalKey, userId);
    const oldScore = oldScoreStr ? parseFloat(oldScoreStr) : 0;

    if (finalScore <= oldScore) return;

    const delta = Math.floor(finalScore) - Math.floor(oldScore);

    const pipeline = this.redis.pipeline();

    pipeline.zadd(globalKey, 'GT', finalScore, userId);
    if (college) {
      pipeline.zadd(
        `ranking:${gameType}:college:${college}`,
        'GT',
        finalScore,
        userId,
      );
    }
    if (department) {
      pipeline.zadd(
        `ranking:${gameType}:department:${department}`,
        'GT',
        finalScore,
        userId,
      );
    }

    if (college) {
      pipeline.zincrby(`ranking:${gameType}:colleges_total`, delta, college);
    }
    if (department) {
      pipeline.zincrby(
        `ranking:${gameType}:departments_total`,
        delta,
        department,
      );
    }

    await pipeline.exec();
  }

  async getTopRankings(gameType: GameType, limit = 10) {
    const globalKey = `ranking:${gameType}:global`;
    const rawRankings = await this.redis.zrevrange(
      globalKey,
      0,
      limit - 1,
      'WITHSCORES',
    );

    if (rawRankings.length === 0) return [];

    const userIds: string[] = [];
    const scores: number[] = [];
    for (let i = 0; i < rawRankings.length; i += 2) {
      userIds.push(rawRankings[i]);
      scores.push(Math.floor(Number(rawRankings[i + 1])));
    }

    const rawProfiles = await this.redis.hmget('user:profiles', ...userIds);

    return userIds.map((userId, idx) => {
      const profile = rawProfiles[idx] ? JSON.parse(rawProfiles[idx]) : null;
      return {
        rank: idx + 1,
        userId,
        nickname: profile ? profile.nickname : 'Unknown',
        college: profile ? profile.college : College.OTHER,
        department: profile ? profile.department : Department.OTHERS,
        score: scores[idx],
      };
    });
  }

  async getGroupRankings(
    gameType: GameType,
    groupType: 'college' | 'department',
    limit = 10,
  ) {
    const targetKey =
      groupType === 'college'
        ? `ranking:${gameType}:colleges_total`
        : `ranking:${gameType}:departments_total`;

    const rawRankings = await this.redis.zrevrange(
      targetKey,
      0,
      limit - 1,
      'WITHSCORES',
    );

    const rankings: { rank: number; name: string; totalScore: number }[] = [];
    for (let i = 0; i < rawRankings.length; i += 2) {
      rankings.push({
        rank: i / 2 + 1,
        name: rawRankings[i],
        totalScore: Math.floor(Number(rawRankings[i + 1])),
      });
    }

    return rankings;
  }

  async getMyRank(userId: string, gameType: GameType) {
    const profile = await this.getUserProfileCache(userId);
    if (!profile) return null;
    const college = profile.college || College.OTHER;
    const department = profile.department || Department.OTHERS;

    const globalKey = `ranking:${gameType}:global`;
    const collegeKey = `ranking:${gameType}:college:${college}`;
    const departmentKey = `ranking:${gameType}:department:${department}`;

    const pipeline = this.redis.pipeline();
    pipeline.zrevrank(globalKey, userId);
    pipeline.zrevrank(collegeKey, userId);
    pipeline.zrevrank(departmentKey, userId);

    const results = await pipeline.exec();
    if (!results) return null;

    const formatRank = (idx: number) => (idx !== null ? idx + 1 : null);

    return {
      globalRank: formatRank(results[0][1] as number),
      collegeRank: formatRank(results[1][1] as number),
      departmentRank: formatRank(results[2][1] as number),
    };
  }

  async bufferScoreLog(userId: string, gameType: GameType, score: number) {
    const logData = {
      userId,
      gameType,
      score,
      playedAt: new Date().toISOString(),
    };

    await this.redis.rpush('buffer:score-logs', JSON.stringify(logData));
  }

  async migrateUserGroup(
    userId: string,
    gameType: GameType,
    oldCollege: College,
    newCollege: College,
    oldDepartment: Department,
    newDepartment: Department,
  ) {
    const scoreStr = await this.redis.zscore(
      `ranking:${gameType}:global`,
      userId,
    );
    if (!scoreStr) return;
    const pureScore = Math.floor(parseFloat(scoreStr));

    const pipeline = this.redis.pipeline();

    if (oldCollege !== newCollege) {
      pipeline.zrem(`ranking:${gameType}:college:${oldCollege}`, userId);
      pipeline.zincrby(
        `ranking:${gameType}:colleges_total`,
        -pureScore,
        oldCollege,
      );

      pipeline.zadd(
        `ranking:${gameType}:college:${newCollege}`,
        'GT',
        scoreStr,
        userId,
      );
      pipeline.zincrby(
        `ranking:${gameType}:colleges_total`,
        pureScore,
        newCollege,
      );
    }

    if (oldDepartment !== newDepartment) {
      pipeline.zrem(`ranking:${gameType}:department:${oldDepartment}`, userId);
      pipeline.zincrby(
        `ranking:${gameType}:departments_total`,
        -pureScore,
        oldDepartment,
      );

      pipeline.zadd(
        `ranking:${gameType}:department:${newDepartment}`,
        'GT',
        scoreStr,
        userId,
      );
      pipeline.zincrby(
        `ranking:${gameType}:departments_total`,
        pureScore,
        newDepartment,
      );
    }

    await pipeline.exec();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async flushScoreLogs() {
    const length = await this.redis.llen('buffer:score-logs');
    if (length === 0) return;

    const rawLogs = await this.redis.lrange('buffer:score-logs', 0, length - 1);
    const entitiesToInsert = rawLogs.map((log) => JSON.parse(log));

    try {
      await this.gamesRepository.insert(entitiesToInsert);
      await this.redis.ltrim('buffer:score-logs', length, -1);
      console.log(
        `[Batch] Flushed ${entitiesToInsert.length} score logs to the database.`,
      );
    } catch (error) {
      console.log(
        `[Batch] Failed to flush score logs to the database: ${error.message}`,
      );
    }
  }

  @OnEvent('user.profile.updated')
  async handleProfileUpdate(payload: {
    userId: string;
    oldCollege: College;
    newCollege: College;
    oldDepartment: Department;
    newDepartment: Department;
  }) {
    const { userId, oldCollege, newCollege, oldDepartment, newDepartment } =
      payload;

    if (oldCollege !== newCollege || oldDepartment !== newDepartment) {
      for (const gameType of Object.values(GameType)) {
        await this.migrateUserGroup(
          userId,
          gameType,
          oldCollege,
          newCollege,
          oldDepartment,
          newDepartment,
        );
      }
    }
  }
}
