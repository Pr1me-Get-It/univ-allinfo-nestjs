import { Injectable } from '@nestjs/common';
import { ExpoToken } from './entities/expo-token.entity';
import { Repository, DataSource } from 'typeorm';
import { KeywordSubscription } from './entities/keyword-subscriptions.entity';

@Injectable()
export class NotificationsRepository extends Repository<ExpoToken> {
  constructor(dataSource: DataSource) {
    super(ExpoToken, dataSource.manager);
  }

  async findAllByUserId(userId: string): Promise<ExpoToken[]> {
    return this.find({
      where: { userId },
    });
  }

  async saveExpoToken(
    userId: string,
    expoPushToken: string,
  ): Promise<ExpoToken> {
    return this.save({
      userId,
      expoPushToken,
    });
  }
}

@Injectable()
export class KeywordSubscriptionsRepository extends Repository<KeywordSubscription> {
  constructor(dataSource: DataSource) {
    super(KeywordSubscription, dataSource.manager);
  }

  async findDistinctKeywords(): Promise<string[]> {
    const rawResults: { keyword: string }[] = await this.createQueryBuilder(
      'keyword_subscriptions',
    )
      .select('DISTINCT keyword_subscriptions.keyword', 'keyword')
      .getRawMany();

    return rawResults.map((row) => row.keyword);
  }
}
