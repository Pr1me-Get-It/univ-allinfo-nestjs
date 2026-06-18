import { Expose } from 'class-transformer';
import type { NullableDate } from '@src/common/types/nullable-date.type';

export class NoticeResponseDto {
  @Expose()
  id: string;

  @Expose()
  source: string;

  @Expose()
  title: string;

  @Expose()
  url: string;

  @Expose()
  postedAt: Date;

  @Expose()
  views: number;

  @Expose()
  kickoff: NullableDate;

  @Expose()
  deadline: NullableDate;
}
