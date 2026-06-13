import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Notice } from '@src/notices/entities/notice.entity';
import { NotificationsService } from '@src/notifications/services/notifications.service';
import scrapingRulesData from './rules/scraping-rules.json';
import { ScrapeConfig } from './scraper.interface';
import { ScraperService } from './scraper.service';

@Injectable()
export class ScrapingOrchestratorService {
  private readonly logger = new Logger(ScrapingOrchestratorService.name);
  private readonly scrapeConfigs = scrapingRulesData as ScrapeConfig[];
  private isRunning = false;

  constructor(
    private readonly scraperService: ScraperService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // 06시부터 22시까지 매 4시간마다 실행
  @Cron('0 6-22/4 * * *')
  async runAllScrapers() {
    if (this.isRunning) {
      this.logger.warn('이전 스크래핑 작업이 진행 중. 스킵합니다.');
      return;
    }

    this.isRunning = true;
    this.logger.log('✨ 스크래핑 파이프라인을 시작합니다...');

    try {
      const CONCURRENCY = 3;
      const tasks = this.scrapeConfigs.flatMap((config) =>
        config.boards.map(
          (board) => () => this.scraperService.scrapeBoard(config, board),
        ),
      );

      const allNotices: Notice[] = [];
      for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        const results = await Promise.allSettled(
          tasks.slice(i, i + CONCURRENCY).map((task) => task()),
        );
        for (const r of results) {
          if (r.status === 'rejected') {
            this.logger.error(
              '스크래핑 실패. 해당 게시판을 건너뜁니다.',
              r.reason instanceof Error ? r.reason.stack : String(r.reason),
            );
          } else {
            allNotices.push(...r.value);
          }
        }
      }

      this.logger.log(`✅ 스크래핑 완료. 신규 공지 총 ${allNotices.length}건`);

      if (allNotices.length > 0) {
        await this.notificationsService.dispatchNotifications(allNotices);
      }
    } finally {
      this.isRunning = false;
    }
  }
}
