import { Brackets, DataSource, Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NoticesRepository extends Repository<Notice> {
  constructor(dataSource: DataSource) {
    super(Notice, dataSource.createEntityManager());
  }

  async findNoticesByCursor(params: {
    take: number;
    keyword?: string;
    sources?: string[];
    cursorData?: { postedAt: Date; id: number }; // 디코딩된 순수 데이터만 받음
  }): Promise<Notice[]> {
    const { take, keyword, sources, cursorData } = params;

    let qb = this.createQueryBuilder('notice')
      .orderBy('notice.postedAt', 'DESC')
      .addOrderBy('notice.id', 'DESC')
      .take(take);

    if (keyword) {
      qb = qb.andWhere('notice.title LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    if (sources && sources.length > 0) {
      qb = qb.andWhere(
        new Brackets((sqb) => {
          sources.forEach((source, index) => {
            const paramName = `source_${index}`;
            const likeString = `${source}%`;
            if (index === 0) {
              sqb.where(`notice.source LIKE :${paramName}`, {
                [paramName]: likeString,
              });
            } else {
              sqb.orWhere(`notice.source LIKE :${paramName}`, {
                [paramName]: likeString,
              });
            }
          });
        }),
      );
    }

    if (cursorData) {
      qb = qb.andWhere(
        '((notice.postedAt < :cursorDate) OR (notice.postedAt = :cursorDate AND notice.id < :cursorId))',
        {
          cursorDate: cursorData.postedAt,
          cursorId: cursorData.id,
        },
      );
    }

    return qb.getMany();
  }
}
