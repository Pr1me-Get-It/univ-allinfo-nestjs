import { Controller, Get, Post, Query } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { ScraperService } from '../scraper/scraper.service';

@Controller('notices')
export class NoticesController {
  constructor(
    private readonly noticesService: NoticesService,
    private readonly scraperService: ScraperService,
  ) {}

  /**
   * [TEST API] 수동으로 스크래핑 봇을 즉시 가동시킵니다.
   */
  @Post('test-scrape')
  async triggerScrape() {
    // 주의: 원래 스케줄러는 백그라운드이므로 비동기로 돕니다. 
    // 여기선 테스트를 위해 작업이 끝날 때까지 기다립니다.
    await this.scraperService.runAllScrapers();
    return {
      message: '스크래핑이 완료되었습니다! GET /notices 로 결과를 확인하세요.',
    };
  }

  /**
   * DB에 잘 적재되었는지 목록을 확인합니다.
   */
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.noticesService.findAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }
}
