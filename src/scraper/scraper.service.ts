import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Notice } from '../notices/entities/notice.entity';
import { ScrapeConfig } from './scraper.interface';
import { extractNotices } from './utils/extractor.util';
import * as scrapingRulesData from './rules/scraping-rules.json';
import { extractDeadline } from './utils/deadlineExtractor';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  // 프로세스 내 재진입 방지 플래그
  private isRunning = false;
  private readonly scrapeConfigs: ScrapeConfig[] = (Array.isArray(
    scrapingRulesData,
  )
    ? scrapingRulesData
    : (scrapingRulesData as any).default) as ScrapeConfig[];

  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  // 06시부터 22시까지 매 4시간마다 실행
  // 알아서 비동기처리 됨. API 응답 지연 없음.
  @Cron('0 6-22/4 * * *')
  async runAllScrapers() {
    if (this.isRunning) {
      this.logger.warn(
        '이전 스크래핑 작업이 아직 진행 중입니다. 이번 사이클은 스킵합니다.',
      );
      return;
    }

    this.isRunning = true;
    this.logger.log('✨ 자동 스크래핑 파이프라인을 시작합니다...');

    try {
      for (const config of this.scrapeConfigs) {
        for (const board of config.boards) {
          this.logger.log(
            `>> 스크래핑 진행 중: ${config.code} - ${board.name}`,
          );
          const notices = await extractNotices(config, board);
          if (notices.length === 0) {
            this.logger.log('   - 추출된 데이터가 없습니다.');
            return;
          }

          const newNotices = await this.dedupeNotices(notices);
          const newNoticesWithDeadline = await extractDeadline(newNotices);
          await this.saveNewNotices(newNoticesWithDeadline);
        }
      }

      this.logger.log('✅ 모든 스크래핑 작업이 완료되었습니다.');
    } catch (e) {
      this.logger.error('스케줄러 실행 중 예외가 발생했습니다.', e as any);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * N+1 쿼리 생성 및 PK 누수를 방지하는 메모리 필터링 bulk insert
   */
  private async dedupeNotices(
    scrapedNotices: Partial<Notice>[],
  ): Promise<Partial<Notice>[]> {
    // 0. 스크랩 결과 내부에서 중복 제거
    const uniqueMap = new Map<string, Partial<Notice>>();
    for (const n of scrapedNotices) {
      const h = n.hashedUrl as string | undefined;
      if (!h) continue;
      if (!uniqueMap.has(h)) uniqueMap.set(h, n);
    }
    const dedupedNotices = Array.from(uniqueMap.values());
    if (dedupedNotices.length !== scrapedNotices.length) {
      this.logger.log(
        `   - 스크랩 내부 중복 제거: ${scrapedNotices.length - dedupedNotices.length}개 제거됨`,
      );
    }

    if (dedupedNotices.length === 0) return [];

    // DB에 있는 항목과 비교하여 이미 존재하는 공지를 제거
    const scrapedHashes = dedupedNotices.map((n) => n.hashedUrl as string);
    const existingNotices = await this.noticeRepository.find({
      select: ['hashedUrl'],
      where: { hashedUrl: In(scrapedHashes) },
    });
    const existingHashSet = new Set(existingNotices.map((n) => n.hashedUrl));

    const newNotices = dedupedNotices.filter(
      (n) => !existingHashSet.has(n.hashedUrl as string),
    );

    if (newNotices.length !== dedupedNotices.length) {
      this.logger.log(
        `   - DB 중복 제거: ${dedupedNotices.length - newNotices.length}개는 이미 DB에 존재하여 스킵됨`,
      );
    }

    return newNotices;
  }

  private async saveNewNotices(newNotices: Partial<Notice>[]) {
    if (newNotices.length === 0) {
      this.logger.log('   - 새로운 공지가 없습니다. (DB Insert 스킵됨)');
      return;
    }

    await this.noticeRepository.insert(newNotices);
    this.logger.log(
      `   - DB 업데이트: ${newNotices.length}개의 새 공지를 저장했습니다!`,
    );
  }
}
