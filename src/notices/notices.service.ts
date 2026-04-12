import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
import { NoticeResponseDto } from './dto/notice-response.dto';
import { PaginatedNoticesDto } from './dto/paginated-notices.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  async findOne(id: string): Promise<NoticeResponseDto> {
    const notice = await this.noticeRepository.findOne({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException(`ID가 ${id}인 공지사항을 찾을 수 없습니다.`);
    }

    notice.views += 1;
    await this.noticeRepository.save(notice);

    return plainToInstance(NoticeResponseDto, notice, {
      excludeExtraneousValues: true,
    });
  }

  async findByCursor(query: CursorPaginationDto): Promise<PaginatedNoticesDto> {
    const limit = query.limit!;
    const take = limit + 1; // 다음 페이지 존재 여부 확인 '+1'

    let qb = this.noticeRepository
      .createQueryBuilder('notice')
      .orderBy('notice.postedAt', 'DESC')
      .addOrderBy('notice.id', 'DESC') // postedAt이 같은 경우 id로 추가 정렬
      .take(take);

    if (query.keyword) {
      qb = qb.andWhere('notice.title LIKE :keyword', {
        keyword: `%${query.keyword}%`,
      });
    }

    if (query.sources && query.sources.length > 0) {
      qb = qb.andWhere(
        new Brackets((sqb) => {
          query.sources?.forEach((source, index) => {
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

    if (query.cursor) {
      try {
        const decodedStr = Buffer.from(query.cursor, 'base64').toString(
          'utf-8',
        );
        const decoded = JSON.parse(decodedStr);

        if (!decoded.postedAt || !decoded.id) {
          throw new Error('Invalid cursor payload');
        }

        const cursorDate = new Date(decoded.postedAt);

        qb = qb.andWhere(
          '((notice.postedAt < :cursorDate)' +
            'OR (notice.postedAt = :cursorDate AND notice.id < :cursorId))',
          {
            cursorDate: cursorDate,
            cursorId: decoded.id,
          },
        );
      } catch (e) {
        throw new BadRequestException('Invalid cursor format');
      }
    }

    const rows = await qb.getMany();

    const hasMore = rows.length === take;
    const items = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor: string | null = null;
    if (hasMore) {
      const lastItem = items[items.length - 1];
      const cursorPayload = {
        postedAt: lastItem.postedAt.toISOString(),
        id: lastItem.id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorPayload)).toString(
        'base64',
      );
    }

    const dtoItems = plainToInstance(NoticeResponseDto, items, {
      excludeExtraneousValues: true,
    });

    return {
      items: dtoItems,
      nextCursor,
      hasMore,
    };
  }
}
