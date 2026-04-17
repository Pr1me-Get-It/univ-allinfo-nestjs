import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
import { NoticeResponseDto } from './dto/notice-response.dto';
import { PaginatedNoticesDto } from './dto/paginated-notices.dto';
import { plainToInstance } from 'class-transformer';
import { NoticesRepository } from './notices.repository';

@Injectable()
export class NoticesService {
  constructor(private readonly noticesRepository: NoticesRepository) {}

  async findOne(id: string): Promise<NoticeResponseDto> {
    const notice = await this.noticesRepository.findOne({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException(`ID가 ${id}인 공지사항을 찾을 수 없습니다.`);
    }

    await this.noticesRepository.increment({ id }, 'views', 1);
    notice.views += 1;

    return plainToInstance(NoticeResponseDto, notice, {
      excludeExtraneousValues: true,
    });
  }

  async findByCursor(query: CursorPaginationDto): Promise<PaginatedNoticesDto> {
    const limit = query.limit!;
    const take = limit + 1; // 다음 페이지 존재 여부 확인 '+1'

    let cursorData: { postedAt: Date; id: string } | undefined;
    if (query.cursor) {
      try {
        const decodedStr = Buffer.from(query.cursor, 'base64').toString(
          'utf-8',
        );
        const decoded = JSON.parse(decodedStr);

        if (!decoded.postedAt || !decoded.id) {
          throw new Error('Invalid cursor format');
        }

        const cursorDate = new Date(decoded.postedAt);
        if (isNaN(cursorDate.getTime())) {
          throw new Error('Invalid date in cursor');
        }

        cursorData = {
          postedAt: cursorDate,
          id: decoded.id,
        };
      } catch (e) {
        throw new BadRequestException('Invalid cursor format');
      }
    }

    const rows = await this.noticesRepository.findNoticesByCursor({
      take,
      keyword: query.keyword,
      sources: query.sources,
      cursorData,
    });

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
