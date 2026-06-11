import { Injectable } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';
import { NotificationsRepository } from './notifications.repository';

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
  ) {
    this.expo = new Expo();
  }

  async sendTestNotification(userId: string) {
    const expoTokens =
      await this.notificationsRepository.findAllByUserId(userId);

    const messages: NotificationMessage[] = expoTokens.map((token) => ({
      to: token.expoPushToken,
      sound: 'default',
      title: '테스트 알림',
      body: '이것은 테스트 알림입니다.',
    }));

    await this.sendMessages(messages);
  }

  private async sendMessages(messages: NotificationMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      this.expo.sendPushNotificationsAsync(chunk);
    }
  }
}
