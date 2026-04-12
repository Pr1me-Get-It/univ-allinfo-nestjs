import { NoticeResponseDto } from './notice-response.dto';

export class PaginatedNoticesDto {
  items!: NoticeResponseDto[];
  nextCursor?: string | null;
  hasMore!: boolean;
}
