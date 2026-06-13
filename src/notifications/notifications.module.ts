import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import {
  KeywordSubscriptionsRepository,
  NotificationsRepository,
  SourceSubscriptionsRepository,
} from './notifications.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpoToken } from './entities/expo-token.entity';
import { KeywordSubscription } from './entities/keyword-subscriptions.entity';
import { SourceSubscription } from './entities/source-subscription.entity';
import { NotificationsService } from './services/notifications.service';
import { KeywordSearchService } from './services/keyword-search.service';

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
    SourceSubscriptionsRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
