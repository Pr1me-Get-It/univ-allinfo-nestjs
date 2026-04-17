import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { OauthProvider } from './enums/oauth-provider.enum';
import { UsersRepository } from './users.repository';
import { NicknameUtil } from './utils/nickname.util';
import { UserProfile } from './entities/user-profile.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findProfileById(id: string): Promise<UserProfile | null> {
    const user = await this.usersRepository.findUserWithProfileById(id);
    return user?.profile || null;
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.usersRepository.findUserWithRefreshToken(id);
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.usersRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async findOrCreateGoogleUser(
    providerId: string,
    email: string,
  ): Promise<User> {
    let user = await this.usersRepository.findByOAuthWithProfile(
      OauthProvider.GOOGLE,
      providerId,
    );

    if (!user) {
      user = this.usersRepository.create({
        email,
        provider: OauthProvider.GOOGLE,
        providerId,
        profile: {
          nickname: NicknameUtil.generateRandomNickname(),
        },
      });
      user = await this.usersRepository.save(user);
    }
    return user;
  }

  async updateHashedRefreshToken(
    userId: string,
    hashedRT: string | null,
  ): Promise<void> {
    await this.usersRepository.update(
      { id: userId },
      { hashedRefreshToken: hashedRT },
    );
  }
}
