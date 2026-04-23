import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import { OauthProvider } from './enums/oauth-provider.enum';
import { UserProfile } from './entities/user-profile.entity';

@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.manager);
  }

  async findUserWithProfileById(id: string): Promise<User | null> {
    return await this.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async findUserWithRefreshToken(id: string): Promise<User | null> {
    return await this.findOne({
      where: { id },
      select: ['id', 'email', 'provider', 'providerId', 'hashedRefreshToken'],
    });
  }

  async findByOAuthWithProfile(
    provider: OauthProvider,
    providerId: string,
  ): Promise<User | null> {
    return await this.findOne({
      where: { provider, providerId },
      relations: ['profile'],
    });
  }

  createProfile(props: { userId: string }): UserProfile {
    const profile = new UserProfile();
    profile.userId = props.userId;
    return profile;
  }
}
