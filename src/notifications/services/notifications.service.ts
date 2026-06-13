import { Injectable, Logger } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';
import { Notice } from '@src/notices/entities/notice.entity';
import {
  KeywordSubscriptionsRepository,
  NotificationsRepository,
  SourceSubscriptionsRepository,
} from '../notifications.repository';
import { KeywordSearchService } from './keyword-serch.service';

interface NotificationMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  badge?: number;
}

interface UserNotificationData {
  keywords: Set<string>;
  sources: Set<string>;
  notices: Set<Notice>;
}

@Injectable()
export class NotificationsService {
  private readonly expo: Expo;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly keywordSubscriptionsRepository: KeywordSubscriptionsRepository,
    private readonly sourceSubscriptionsRepository: SourceSubscriptionsRepository,
    private readonly keywordSearchService: KeywordSearchService,
  ) {
    this.expo = new Expo();
  }

  async saveExpoToken(userId: string, expoPushToken: string) {
    return this.notificationsRepository.saveExpoToken(userId, expoPushToken);
  }

  async saveKeywords(
    userId: string,
    keywords: string[],
  ): Promise<{ added: number; ignored: number }> {
    const added = await this.keywordSubscriptionsRepository.saveMany(
      userId,
      keywords,
    );
    this.keywordSearchService
      .addKeywords(keywords)
      .catch((error) => this.logger.error('Error adding keywords:', error));
    return { added, ignored: keywords.length - added };
  }

  async deleteKeywords(
    userId: string,
    keywords: string[],
  ): Promise<{ deleted: number }> {
    const deleted = await this.keywordSubscriptionsRepository.deleteMany(
      userId,
      keywords,
    );
    this.keywordSearchService
      .deleteKeywords(keywords)
      .catch((error) => this.logger.error('Error deleting keywords:', error));
    return { deleted };
  }

  async saveSources(
    userId: string,
    sources: string[],
  ): Promise<{ added: number; ignored: number }> {
    const added = await this.sourceSubscriptionsRepository.saveMany(
      userId,
      sources,
    );
    return { added, ignored: sources.length - added };
  }

  async deleteSources(
    userId: string,
    sources: string[],
  ): Promise<{ deleted: number }> {
    const deleted = await this.sourceSubscriptionsRepository.deleteMany(
      userId,
      sources,
    );
    return { deleted };
  }

  async dispatchNotifications(notices: Notice[]): Promise<void> {
    const userDataMap = await this.buildUserDataMap(notices);
    if (userDataMap.size === 0) return;

    const messages = await this.buildMessages(userDataMap);
    if (messages.length === 0) return;

    await this.sendMessages(messages);
    this.logger.log(`푸시 알림 발송: ${messages.length}명`);
  }

  private async buildUserDataMap(
    notices: Notice[],
  ): Promise<Map<string, UserNotificationData>> {
    const userDataMap = new Map<string, UserNotificationData>();

    const merge = (userId: string, patch: Partial<UserNotificationData>) => {
      const entry = userDataMap.get(userId) ?? {
        keywords: new Set(),
        sources: new Set(),
        notices: new Set(),
      };
      patch.keywords?.forEach((k) => entry.keywords.add(k));
      patch.sources?.forEach((s) => entry.sources.add(s));
      patch.notices?.forEach((n) => entry.notices.add(n));
      userDataMap.set(userId, entry);
    };

    await this.applyKeywordMatches(notices, merge);
    await this.applySourceMatches(notices, merge);

    return userDataMap;
  }

  private async applyKeywordMatches(
    notices: Notice[],
    merge: (userId: string, patch: Partial<UserNotificationData>) => void,
  ): Promise<void> {
    const keywordToNotices = new Map<string, Notice[]>();
    for (const notice of notices) {
      for (const keyword of this.keywordSearchService.search(notice.title)) {
        keywordToNotices.set(keyword, [
          ...(keywordToNotices.get(keyword) ?? []),
          notice,
        ]);
      }
    }
    if (keywordToNotices.size === 0) return;

    const keywordToUserIds =
      await this.keywordSubscriptionsRepository.findUserIdsByKeywords(
        Array.from(keywordToNotices.keys()),
      );

    for (const [keyword, noticeList] of keywordToNotices) {
      for (const userId of keywordToUserIds.get(keyword) ?? []) {
        merge(userId, {
          keywords: new Set([keyword]),
          notices: new Set(noticeList),
        });
      }
    }
  }

  private async applySourceMatches(
    notices: Notice[],
    merge: (userId: string, patch: Partial<UserNotificationData>) => void,
  ): Promise<void> {
    const sourceToNotices = new Map<string, Notice[]>();
    for (const notice of notices) {
      sourceToNotices.set(notice.source, [
        ...(sourceToNotices.get(notice.source) ?? []),
        notice,
      ]);
    }

    const sourceToUserIds =
      await this.sourceSubscriptionsRepository.findUserIdsBySources(
        Array.from(sourceToNotices.keys()),
      );

    for (const [source, noticeList] of sourceToNotices) {
      for (const userId of sourceToUserIds.get(source) ?? []) {
        merge(userId, {
          sources: new Set([source]),
          notices: new Set(noticeList),
        });
      }
    }
  }

  private async buildMessages(
    userDataMap: Map<string, UserNotificationData>,
  ): Promise<NotificationMessage[]> {
    const allUserIds = Array.from(userDataMap.keys());
    const expoTokens =
      await this.notificationsRepository.findActiveTokensByUserIds(allUserIds);

    const userIdToTokens = new Map<string, string[]>();
    for (const { userId, expoPushToken } of expoTokens) {
      userIdToTokens.set(userId, [
        ...(userIdToTokens.get(userId) ?? []),
        expoPushToken,
      ]);
    }

    const messages: NotificationMessage[] = [];
    for (const [userId, { keywords, sources, notices }] of userDataMap) {
      const tokens = userIdToTokens.get(userId);
      if (!tokens || tokens.length === 0) continue;

      const noticeList = [...notices];
      const labels = [...[...keywords].map((k) => `'${k}'`), ...[...sources]];
      const labelStr = `[${labels.join(', ')}]`;
      const body =
        noticeList.length === 1
          ? noticeList[0].title
          : `${noticeList[0].title} 외 ${noticeList.length - 1}건`;
      const data = { noticeIds: noticeList.map((n) => n.id) };

      for (const token of tokens) {
        if (!Expo.isExpoPushToken(token)) continue;
        messages.push({
          to: token,
          sound: 'default',
          title: `${labelStr} 관련 새 공지사항`,
          body,
          data,
        });
      }
    }
    return messages;
  }

  private async sendMessages(messages: NotificationMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const ticket = await this.expo.sendPushNotificationsAsync(chunk);
      this.logger.log(ticket);
    }
  }
}
