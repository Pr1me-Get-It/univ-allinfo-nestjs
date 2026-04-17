import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { NoticesModule } from '@src/notices/notices.module';

@Module({
  imports: [NoticesModule],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
