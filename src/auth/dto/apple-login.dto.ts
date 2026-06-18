import { IsString } from 'class-validator';

export class AppleLoginDto {
  @IsString()
  idToken: string;

  @IsString()
  authorizationCode: string;
}
