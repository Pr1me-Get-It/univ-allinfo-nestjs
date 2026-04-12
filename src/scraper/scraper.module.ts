import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperService } from './scraper.service';
import { Notice } from '../notices/entities/notice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notice])],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
