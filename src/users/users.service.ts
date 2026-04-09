import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { OauthProvider } from './enums/oauth-provider.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findByIdWithRefreshToken(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'provider', 'providerId', 'hashedRefreshToken'],
    });
  }

  async deleteById(id: string) {
    const result = await this.userRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async findOrCreateGoogleUser(providerId: string, email: string) {
    let user = await this.findByGoogleProviderId(providerId);

    if (!user) {
      user = await this.createGoogleUser(providerId, email);
    }
    return user;
  }

  async updateHashedRefreshToken(userId: string, hashedRT: string | null) {
    await this.userRepository.update(
      { id: userId },
      { hashedRefreshToken: hashedRT },
    );
  }

  private async findByGoogleProviderId(
    providerId: string,
  ): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { provider: OauthProvider.GOOGLE, providerId: providerId },
    });
  }

  private async createGoogleUser(
    providerId: string,
    email: string,
  ): Promise<User> {
    const newUser = this.userRepository.create({
      provider: OauthProvider.GOOGLE,
      providerId: providerId,
      email: email,
      profile: {},
    });
    return await this.userRepository.save(newUser);
  }
}
