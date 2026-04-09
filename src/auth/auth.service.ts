import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@src/users/users.service';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { HumanReadableTime } from '@src/common/types';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
    );
  }

  async googleLogin(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    const user = await this.userService.findOrCreateGoogleUser(
      payload?.sub,
      payload?.email,
    );

    return await this.generateTokenAndUpdateRTR(user.id);
  }

  async refreshTokens(userId: string, incomingRefreshToken: string) {
    const user = await this.userService.findByIdWithRefreshToken(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('User not found or no refresh token set');
    }

    // 이거 너무 길어지면 bcrypt가 앞에 부분만 compare해서 해싱 후 처리
    const incomingRTHashForBcrypt = crypto
      .createHash('sha256')
      .update(incomingRefreshToken)
      .digest('hex');

    const isMatch = await bcrypt.compare(
      incomingRTHashForBcrypt,
      user.hashedRefreshToken,
    );

    if (!isMatch) {
      await this.userService.updateHashedRefreshToken(userId, null);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return await this.generateTokenAndUpdateRTR(userId);
  }

  async withdraw(userId: string) {
    await this.userService.deleteById(userId);
    return { message: 'User account deleted successfully' };
  }

  private async generateTokenAndUpdateRTR(userId: string) {
    const jwtPayload = { sub: userId };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<HumanReadableTime>(
        'JWT_ACCESS_EXPIRATION',
      ),
    });

    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<HumanReadableTime>(
        'JWT_REFRESH_EXPIRATION',
      ),
    });

    const rtHashForBcrypt = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const hashedRT = await bcrypt.hash(rtHashForBcrypt, 10);
    await this.userService.updateHashedRefreshToken(userId, hashedRT);

    return { accessToken, refreshToken };
  }
}
