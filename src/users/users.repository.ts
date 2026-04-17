import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import { OauthProvider } from './enums/oauth-provider.enum';

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

  async findByOAuth(
    provider: OauthProvider,
    providerId: string,
  ): Promise<User | null> {
    return await this.findOne({
      where: { provider, providerId },
    });
  }
}
