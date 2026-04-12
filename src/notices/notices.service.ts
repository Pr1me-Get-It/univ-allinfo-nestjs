import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  /**
   * DB에 저장된 공지사항을 최신순으로 가져옵니다. (테스트 및 기능 확인용)
   */
  async findAll({ page = 1, limit = 20 }: { page?: number; limit?: number }) {
    const [data, total] = await this.noticeRepository.findAndCount({
      order: { postedAt: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
