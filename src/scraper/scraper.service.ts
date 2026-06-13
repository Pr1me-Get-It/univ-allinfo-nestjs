import { Injectable, Logger } from '@nestjs/common';
import { Notice } from '../notices/entities/notice.entity';
import { ScrapeConfig } from './scraper.interface';
import { extractNotices } from './utils/extractor.util';
import { extractDeadline } from './utils/deadlineExtractor';
import { NoticesRepository } from '@src/notices/notices.repository';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(private readonly noticeRepository: NoticesRepository) {}

  async scrapeBoard(
    config: ScrapeConfig,
    board: { name: string; path: string },
  ): Promise<Notice[]> {
    const notices = await extractNotices(config, board);
    if (notices.length === 0) return [];

    const newNotices = await this.dedupeNotices(notices);
    const newNoticesWithDeadline = await extractDeadline(newNotices);
    return this.saveNewNotices(newNoticesWithDeadline);
  }

  private async dedupeNotices(
    scrapedNotices: Partial<Notice>[],
  ): Promise<Partial<Notice>[]> {
    const uniqueMap = new Map<string, Partial<Notice>>();
    for (const n of scrapedNotices) {
      const h = n.hashedUrl;
      if (!h) continue;
      if (!uniqueMap.has(h)) uniqueMap.set(h, n);
    }
    const dedupedNotices = Array.from(uniqueMap.values());

    if (dedupedNotices.length === 0) return [];

    const scrapedHashes = dedupedNotices.map((n) => n.hashedUrl as string);
    const existingHashSet = new Set(
      await this.noticeRepository.findHashedUrlsByHashedUrlIn(scrapedHashes),
    );

    return dedupedNotices.filter(
      (n) => !existingHashSet.has(n.hashedUrl as string),
    );
  }

  private async saveNewNotices(
    newNotices: Partial<Notice>[],
  ): Promise<Notice[]> {
    if (newNotices.length === 0) return [];
    await this.noticeRepository.insert(newNotices);
    this.logger.log(`DB 업데이트: ${newNotices.length}개의 새 공지 저장`);
    return newNotices as Notice[];
  }
}
