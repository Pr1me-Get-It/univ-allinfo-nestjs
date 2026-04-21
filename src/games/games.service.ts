import { Injectable } from '@nestjs/common';
import { GamesRepository } from './games.repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class GamesService {
  constructor(
    private readonly gamesRepository: GamesRepository,
    @InjectRedis() private readonly redis: Redis,
  ) {}
}
