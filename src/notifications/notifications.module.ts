import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import {
  KeywordSubscriptionsRepository,
  NotificationsRepository,
} from './notifications.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpoToken } from './entities/expo-token.entity';
import { KeywordSubscription } from './entities/keyword-subscriptions.entity';
import { SourceSubscription } from './entities/source-subscription.entity';
import { NotificationsService } from './notifications.service';
import { KeywordSearchService } from './keyword-serch.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExpoToken,
      KeywordSubscription,
      SourceSubscription,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    KeywordSearchService,
    KeywordSubscriptionsRepository,
  ],
})
export class NotificationsModule {}
