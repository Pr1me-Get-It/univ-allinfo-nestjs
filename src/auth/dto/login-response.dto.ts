import { User } from '@src/users/entities/user.entity';
import { UserProfile } from '@src/users/entities/user-profile.entity';
import { OauthProvider } from '@src/users/enums/oauth-provider.enum';

export class UserResponseDto {
  id: string;
  email: string;
  provider: OauthProvider;
  createdAt: Date;
  profile?: UserProfile;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.provider = user.provider;
    dto.createdAt = user.createdAt;
    dto.profile = user.profile;
    return dto;
  }
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;

  constructor(accessToken: string, refreshToken: string, user: User) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = UserResponseDto.fromEntity(user);
  }
}
