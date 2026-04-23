import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class ScoreSubmitReqDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000000000)
  score: number;
}
