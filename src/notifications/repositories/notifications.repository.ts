import { Injectable } from '@nestjs/common';
import { ExpoToken } from '../entities/expo-token.entity';
import { Repository, DataSource, In } from 'typeorm';
import { KeywordSubscription } from '../entities/keyword-subscription.entity';
import { SourceSubscription } from '../entities/source-subscription.entity';
import { UUIDTransformer } from '@src/common/transformers/uuid.transformer';
import { ExpoPushToken } from '../expo-push-token.type';

const uuidTransformer = new UUIDTransformer();

@Injectable()
export class NotificationsRepository extends Repository<ExpoToken> {
  constructor(dataSource: DataSource) {
    super(ExpoToken, dataSource.manager);
  }

  async findAllByUserId(userId: string): Promise<ExpoToken[]> {
    return this.find({ where: { userId } });
  }

  async saveExpoToken(
    userId: string,
    expoPushToken: ExpoPushToken,
  ): Promise<void> {
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

  async setActive(
    userId: string,
    expoPushToken: ExpoPushToken,
    isActive: boolean,
  ): Promise<void> {
    await this.update({ userId, expoPushToken }, { isActive });
  }
}

@Injectable()
export class KeywordSubscriptionsRepository extends Repository<KeywordSubscription> {
  constructor(dataSource: DataSource) {
    super(KeywordSubscription, dataSource.manager);
  }

  async findByUserId(userId: string): Promise<string[]> {
    const rows = await this.find({ where: { userId }, select: ['keyword'] });
    return rows.map((r) => r.keyword);
  }

  async findExistingKeywords(
    userId: string,
    keywords: string[],
  ): Promise<Set<string>> {
    if (keywords.length === 0) return new Set();
    const rows = await this.find({
      where: { userId, keyword: In(keywords) },
      select: ['keyword'],
    });
    return new Set(rows.map((r) => r.keyword));
  }

  async saveMany(userId: string, keywords: string[]): Promise<number> {
    if (keywords.length === 0) return 0;
    const result = await this.createQueryBuilder()
      .insert()
      .into(KeywordSubscription)
      .values(keywords.map((keyword) => ({ userId, keyword })))
      .orIgnore()
      .execute();
    const affectedRows = (result.raw as { affectedRows?: number })
      ?.affectedRows;
    return typeof affectedRows === 'number'
      ? affectedRows
      : result.identifiers.length;
  }

  async deleteMany(userId: string, keywords: string[]): Promise<number> {
    if (keywords.length === 0) return 0;
    const result = await this.delete({ userId, keyword: In(keywords) });
    return result.affected ?? 0;
  }

  async findKeywordCounts(): Promise<Map<string, number>> {
    const rows = await this.createQueryBuilder('ks')
      .select('ks.keyword', 'keyword')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ks.keyword')
      .getRawMany<{ keyword: string; count: string }>();

    return new Map(
      rows.map(({ keyword, count }) => [keyword, parseInt(count, 10)]),
    );
  }

  async findUserIdsByKeywords(
    keywords: string[],
  ): Promise<Map<string, string[]>> {
    if (keywords.length === 0) return new Map();

    const rows = await this.createQueryBuilder('ks')
      .select('ks.keyword', 'keyword')
      .addSelect('ks.user_id', 'userId')
      .where('ks.keyword IN (:...keywords)', { keywords })
      .getRawMany<{ keyword: string; userId: Buffer }>();

    const result = new Map<string, string[]>();
    for (const { keyword, userId } of rows) {
      const list = result.get(keyword) ?? [];
      list.push(uuidTransformer.from(userId) as string);
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

  async findByUserId(userId: string): Promise<string[]> {
    const rows = await this.find({ where: { userId }, select: ['source'] });
    return rows.map((r) => r.source);
  }

  async saveMany(userId: string, sources: string[]): Promise<number> {
    if (sources.length === 0) return 0;
    const result = await this.createQueryBuilder()
      .insert()
      .into(SourceSubscription)
      .values(sources.map((source) => ({ userId, source })))
      .orIgnore()
      .execute();
    const affectedRows = (result.raw as { affectedRows?: number })
      ?.affectedRows;
    return typeof affectedRows === 'number'
      ? affectedRows
      : result.identifiers.length;
  }

  async deleteMany(userId: string, sources: string[]): Promise<number> {
    if (sources.length === 0) return 0;
    const result = await this.delete({ userId, source: In(sources) });
    return result.affected ?? 0;
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
      .getRawMany<{ source: string; userId: Buffer }>();

    const result = new Map<string, string[]>();
    for (const { source, userId } of rows) {
      const list = result.get(source) ?? [];
      list.push(uuidTransformer.from(userId) as string);
      result.set(source, list);
    }
    return result;
  }
}
