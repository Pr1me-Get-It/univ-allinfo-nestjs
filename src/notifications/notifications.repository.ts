import { Injectable } from '@nestjs/common';
import { ExpoToken } from './entities/expo-token.entity';
import { Repository, DataSource } from 'typeorm';

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
}
