import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScrapingOrchestratorService } from './scraping-orchestrator.service';
import { NoticesModule } from '@src/notices/notices.module';
import { NotificationsModule } from '@src/notifications/notifications.module';

@Module({
  imports: [NoticesModule, NotificationsModule],
  providers: [ScraperService, ScrapingOrchestratorService],
})
export class ScraperModule {}
