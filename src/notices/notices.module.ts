import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticesService } from './notices.service';
import { NoticesController } from './notices.controller';
import { Notice } from './entities/notice.entity';
import { ScraperModule } from '../scraper/scraper.module';
import { NoticesRepository } from './notices.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notice]),
    ScraperModule, // 수동 스크래핑 테스트를 위해 주입
  ],
  controllers: [NoticesController],
  providers: [NoticesService, NoticesRepository],
})
export class NoticesModule {}
