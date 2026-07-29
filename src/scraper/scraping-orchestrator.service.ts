import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Notice } from '@src/notices/entities/notice.entity';
import { NotificationsService } from '@src/notifications/services/notifications.service';
import scrapingRulesData from './rules/scraping-rules.json';
import { ScrapeConfig } from './scraper.interface';
import { ScraperService } from './scraper.service';

// 학교 자체 서버(155.230.x.x) 방화벽에서 droplet IP가 부분 차단되어
// 일시적으로 제외. 차단 해제 확인되면 목록에서 제거할 것.
const DISABLED_CODES = ['KNU_NEWS', 'STRT', 'SPRT', 'TCHR', 'SEE'];

// 동시 요청으로 인한 재차단 위험을 배제하기 위해 완전 순차 처리 + 게시판 간 간격
const SEQUENTIAL_DELAY_MS = 15000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class ScrapingOrchestratorService {
  private readonly logger = new Logger(ScrapingOrchestratorService.name);
  private readonly scrapeConfigs = (scrapingRulesData as ScrapeConfig[]).filter(
    (config) => !DISABLED_CODES.includes(config.code),
  );
  private isRunning = false;

  constructor(
    private readonly scraperService: ScraperService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 18 * * *', {
    timeZone: 'Asia/Seoul',
  })
  async runAllScrapers() {
    if (this.isRunning) {
      this.logger.warn('이전 스크래핑 작업이 진행 중. 스킵합니다.');
      return;
    }

    this.isRunning = true;
    this.logger.log('✨ 스크래핑 파이프라인을 시작합니다...');

    try {
      const tasks = this.scrapeConfigs.flatMap((config) =>
        config.boards.map(
          (board) => () => this.scraperService.scrapeBoard(config, board),
        ),
      );

      const allNotices: Notice[] = [];
      for (let i = 0; i < tasks.length; i++) {
        try {
          const notices = await tasks[i]();
          allNotices.push(...notices);
        } catch (error: unknown) {
          this.logger.error(
            '스크래핑 실패. 해당 게시판을 건너뜁니다.',
            error instanceof Error ? error.stack : String(error),
          );
        }

        if (i < tasks.length - 1) {
          await sleep(SEQUENTIAL_DELAY_MS);
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
