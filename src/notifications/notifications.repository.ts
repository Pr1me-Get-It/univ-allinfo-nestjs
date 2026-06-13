import { Injectable } from '@nestjs/common';
import { ExpoToken } from './entities/expo-token.entity';
import { Repository, DataSource, In } from 'typeorm';
import { KeywordSubscription } from './entities/keyword-subscriptions.entity';
import { SourceSubscription } from './entities/source-subscription.entity';

@Injectable()
export class NotificationsRepository extends Repository<ExpoToken> {
  constructor(dataSource: DataSource) {
    super(ExpoToken, dataSource.manager);
  }

  async findAllByUserId(userId: string): Promise<ExpoToken[]> {
    return this.find({ where: { userId } });
  }

  async saveExpoToken(userId: string, expoPushToken: string): Promise<void> {
    await this.createQueryBuilder()
      .insert()
      .into(ExpoToken)
      .values({ userId, expoPushToken })
      .orIgnore()
      .execute();
  }

  async findActiveTokensByUserIds(userIds: string[]): Promise<ExpoToken[]> {
    if (userIds.length === 0) return [];
    return this.find({ where: { userId: In(userIds), isActive: true } });
  }
}

@Injectable()
export class KeywordSubscriptionsRepository extends Repository<KeywordSubscription> {
  constructor(dataSource: DataSource) {
    super(KeywordSubscription, dataSource.manager);
  }

  async saveMany(userId: string, keywords: string[]): Promise<number> {
    const result = await this.createQueryBuilder()
      .insert()
      .into(KeywordSubscription)
      .values(keywords.map((keyword) => ({ userId, keyword })))
      .orIgnore()
      .execute();
    return (result.raw as { affectedRows: number }).affectedRows;
  }

  async findDistinctKeywords(): Promise<string[]> {
    const rawResults: { keyword: string }[] = await this.createQueryBuilder(
      'keyword_subscriptions',
    )
      .select('DISTINCT keyword_subscriptions.keyword', 'keyword')
      .getRawMany();

    return rawResults.map((row) => row.keyword);
  }

  async findUserIdsByKeywords(
    keywords: string[],
  ): Promise<Map<string, string[]>> {
    if (keywords.length === 0) return new Map();

    const rows = await this.createQueryBuilder('ks')
      .select('ks.keyword', 'keyword')
      .addSelect('ks.user_id', 'userId')
      .where('ks.keyword IN (:...keywords)', { keywords })
      .getRawMany<{ keyword: string; userId: string }>();

    const result = new Map<string, string[]>();
    for (const { keyword, userId } of rows) {
      const list = result.get(keyword) ?? [];
      list.push(userId);
      result.set(keyword, list);
    }
    return result;
  }
}

@Injectable()
export class SourceSubscriptionsRepository extends Repository<SourceSubscription> {
  constructor(dataSource: DataSource) {
    super(SourceSubscription, dataSource.manager);
  }

  async saveMany(userId: string, sources: string[]): Promise<number> {
    const result = await this.createQueryBuilder()
      .insert()
      .into(SourceSubscription)
      .values(sources.map((source) => ({ userId, source })))
      .orIgnore()
      .execute();
    return (result.raw as { affectedRows: number }).affectedRows;
  }

  /** source 목록에 구독 중인 userId를 source별로 묶어 반환합니다. */
  async findUserIdsBySources(
    sources: string[],
  ): Promise<Map<string, string[]>> {
    if (sources.length === 0) return new Map();

    const rows = await this.createQueryBuilder('ss')
      .select('ss.source', 'source')
      .addSelect('ss.user_id', 'userId')
      .where('ss.source IN (:...sources)', { sources })
      .getRawMany<{ source: string; userId: string }>();

    const result = new Map<string, string[]>();
    for (const { source, userId } of rows) {
      const list = result.get(source) ?? [];
      list.push(userId);
      result.set(source, list);
    }
    return result;
  }
}
