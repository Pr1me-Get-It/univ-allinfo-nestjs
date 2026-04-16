import { Expose } from 'class-transformer';

export class NoticeResponseDto {
  @Expose()
  id!: string;

  @Expose()
  source!: string;

  @Expose()
  title!: string;

  @Expose()
  url!: string;

  @Expose()
  postedAt!: Date;

  @Expose()
  views!: number;

  @Expose()
  kickoff!: Date | null;

  @Expose()
  deadline!: Date | null;
}
