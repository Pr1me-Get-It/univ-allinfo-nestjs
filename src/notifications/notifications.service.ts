import { Injectable } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';
import {
  KeywordSubscriptionsRepository,
  NotificationsRepository,
} from './notifications.repository';
import { KeywordSearchService } from './keyword-serch.service';

interface NotificationMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  badge?: number;
}

@Injectable()
export class NotificationsService {
  private readonly expo: Expo;

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly keywordSubscriptionsRepository: KeywordSubscriptionsRepository,
    private readonly keywordSearchService: KeywordSearchService,
  ) {
    this.expo = new Expo();
  }

  async saveExpoToken(userId: string, expoPushToken: string) {
    return this.notificationsRepository.saveExpoToken(userId, expoPushToken);
  }

  async saveKeywords(userId: string, keywords: string[]) {
    await this.keywordSubscriptionsRepository.save({ userId, keywords });
    this.keywordSearchService
      .addKeywords(keywords)
      .catch((error) =>
        console.error('[NotificationsService] Error adding keywords:', error),
      );
  }

  private async sendMessages(messages: NotificationMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      const ticket = await this.expo.sendPushNotificationsAsync(chunk);
      console.log(ticket);
    }
  }
}
