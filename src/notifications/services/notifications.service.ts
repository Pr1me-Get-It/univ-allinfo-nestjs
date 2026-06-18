import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';
import { Notice } from '@src/notices/entities/notice.entity';
import {
  KeywordSubscriptionsRepository,
  NotificationsRepository,
  SourceSubscriptionsRepository,
} from '../notifications.repository';
import { KeywordSearchService } from './keyword-search.service';
import { ExpoPushToken } from '../types/expo-push-token.type';

interface NotificationMessage {
  to: ExpoPushToken;
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
    if (!Expo.isExpoPushToken(expoPushToken)) {
      throw new BadRequestException('Invalid Expo push token');
    }
    return this.notificationsRepository.saveExpoToken(
      userId,
      expoPushToken as ExpoPushToken,
    );
  }

  async getKeywords(userId: string): Promise<string[]> {
    return this.keywordSubscriptionsRepository.findByUserId(userId);
  }

  async getSources(userId: string): Promise<string[]> {
    return this.sourceSubscriptionsRepository.findByUserId(userId);
  }

  async setExpoTokenActive(
    userId: string,
    expoPushToken: string,
    isActive: boolean,
  ): Promise<void> {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      throw new BadRequestException('Invalid Expo push token');
    }
    return this.notificationsRepository.setActive(
      userId,
      expoPushToken as ExpoPushToken,
      isActive,
    );
  }

  async saveKeywords(
    userId: string,
    keywords: string[],
  ): Promise<{ added: number; ignored: number }> {
    const unique = Array.from(new Set(keywords));
    const existing =
      await this.keywordSubscriptionsRepository.findExistingKeywords(
        userId,
        unique,
      );
    const newToUser = unique.filter((k) => !existing.has(k));
    const added = await this.keywordSubscriptionsRepository.saveMany(
      userId,
      unique,
    );
    if (newToUser.length > 0) {
      this.keywordSearchService
        .addKeywords(newToUser)
        .catch((error) => this.logger.error('Error adding keywords:', error));
    }
    return { added, ignored: keywords.length - added };
  }

  async deleteKeywords(
    userId: string,
    keywords: string[],
  ): Promise<{ deleted: number }> {
    const unique = Array.from(new Set(keywords));
    const existing =
      await this.keywordSubscriptionsRepository.findExistingKeywords(
        userId,
        unique,
      );
    const toDelete = unique.filter((k) => existing.has(k));
    const deleted = await this.keywordSubscriptionsRepository.deleteMany(
      userId,
      unique,
    );
    if (toDelete.length > 0) {
      this.keywordSearchService
        .deleteKeywords(toDelete)
        .catch((error) => this.logger.error('Error deleting keywords:', error));
    }
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
        const list = keywordToNotices.get(keyword);
        if (list) {
          list.push(notice);
        } else {
          keywordToNotices.set(keyword, [notice]);
        }
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
    // notice.source 형태: "CSE_학부공지" → 구독 코드: "CSE"
    const codeToNotices = new Map<string, Notice[]>();
    for (const notice of notices) {
      const code = notice.source.split('_')[0];
      const list = codeToNotices.get(code);
      if (list) {
        list.push(notice);
      } else {
        codeToNotices.set(code, [notice]);
      }
    }

    const sourceToUserIds =
      await this.sourceSubscriptionsRepository.findUserIdsBySources(
        Array.from(codeToNotices.keys()),
      );

    for (const [source, noticeList] of codeToNotices) {
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
      const list = userIdToTokens.get(userId);
      if (list) {
        list.push(expoPushToken);
      } else {
        userIdToTokens.set(userId, [expoPushToken]);
      }
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
          to: token as ExpoPushToken,
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
    await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          this.logger.log(tickets);
        } catch (error) {
          this.logger.error('Failed to send push notification chunk:', error);
        }
      }),
    );
  }
}
