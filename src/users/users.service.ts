import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { OauthProvider } from './enums/oauth-provider.enum';
import { UsersRepository } from './users.repository';
import { NicknameUtil } from './utils/nickname.util';
import { UserProfile } from './entities/user-profile.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { College } from './enums/college.enum';
import { Department } from './enums/department.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @InjectRedis() private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

    if (user.profile) {
      await this.cacheUserProfile(user.id, user.profile);
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

  async updateProfile(
    userId: string,
    profileData: Partial<UserProfile>,
  ): Promise<UserProfile> {
    const user = await this.usersRepository.findUserWithProfileById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile =
      user.profile || this.usersRepository.createProfile({ userId: user.id });

    const oldCollege = profile.college ?? College.OTHER;
    const oldDepartment = profile.department ?? Department.OTHERS;

    Object.assign(profile, profileData);
    await this.usersRepository.save(user);

    const newCollege = profile.college ?? College.OTHER;
    const newDepartment = profile.department ?? Department.OTHERS;

    if (oldCollege !== newCollege || oldDepartment !== newDepartment) {
      this.eventEmitter.emit('user.profile.updated', {
        userId,
        oldCollege,
        newCollege,
        oldDepartment,
        newDepartment,
      });
    }

    await this.cacheUserProfile(userId, profile);
    return profile;
  }

  private async cacheUserProfile(userId: string, profile: UserProfile) {
    await this.redis.hset(
      'user:profiles',
      userId,
      JSON.stringify({
        nickname: profile.nickname,
        college: profile.college ?? College.OTHER,
        department: profile.department ?? Department.OTHERS,
      }),
    );
  }
}
