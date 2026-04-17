import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { OauthProvider } from './enums/oauth-provider.enum';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.usersRepository.findUserWithRefreshToken(id);
  }

  async deleteById(id: string) {
    const result = await this.usersRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async findOrCreateGoogleUser(
    providerId: string,
    email: string,
  ): Promise<User> {
    let user = await this.usersRepository.findByOAuth(
      OauthProvider.GOOGLE,
      providerId,
    );

    if (!user) {
      user = this.usersRepository.create({
        email: email,
        provider: OauthProvider.GOOGLE,
        providerId: providerId,
      });
      user = await this.usersRepository.save(user);
    }
    return user;
  }

  async updateHashedRefreshToken(userId: string, hashedRT: string | null) {
    await this.usersRepository.update(
      { id: userId },
      { hashedRefreshToken: hashedRT },
    );
  }
}
