import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperService } from './scraper.service';
import { Notice } from '../notices/entities/notice.entity';
import { NoticesRepository } from '@src/notices/notices.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Notice])],
  providers: [ScraperService, NoticesRepository],
  exports: [ScraperService],
})
export class ScraperModule {}
