import { IsBoolean, IsString, MaxLength } from 'class-validator';

export class SetExpoTokenActiveDto {
  @IsString()
  @MaxLength(512)
  expoPushToken: string;

  @IsBoolean()
  isActive: boolean;
}
