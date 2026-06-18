import { IsString, MaxLength } from 'class-validator';

export class SaveExpoTokenDto {
  @IsString()
  @MaxLength(512)
  expoPushToken: string;
}
