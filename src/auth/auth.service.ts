import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@src/users/users.service';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { HumanReadableTime } from '@src/common/types';
import appleSignin from 'apple-signin-auth';
import { OauthProvider } from '@src/users/enums/oauth-provider.enum';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private appleSecretClient: string;

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
    );
    this.appleSecretClient = appleSignin.getClientSecret({
      clientID: this.configService.get<string>('APPLE_CLIENT_ID')!,
      teamID: this.configService.get<string>('APPLE_TEAM_ID')!,
      keyIdentifier: this.configService.get<string>('APPLE_KEY_ID')!,
      privateKey: this.configService
        .get<string>('APPLE_PRIVATE_KEY')!
        .replace(/\\n/g, '\n'),
    });
  }

  async appleLogin(token: string, authorizationCode: string) {
    try {
      const decoded = await appleSignin.verifyIdToken(token, {
        audience: this.configService.get<string>('APPLE_CLIENT_ID'),
        ignoreExpiration: false,
      });

      const appleUserId = decoded.sub;
      const email = decoded.email;

      const tokenResponse = await appleSignin.getAuthorizationToken(
        authorizationCode,
        {
          clientID: this.configService.get<string>('APPLE_CLIENT_ID')!,
          clientSecret: this.appleSecretClient,
          redirectUri: '', // 에러 방지용 더미 데이터
        },
      );
      const appleRefreshToken = tokenResponse.refresh_token;

      const user = await this.userService.findOrCreateAppleUser(
        appleUserId,
        email,
        appleRefreshToken,
      );

      const tokens = await this.generateTokenAndUpdateRTR(user.id);
      return new LoginResponseDto(
        tokens.accessToken,
        tokens.refreshToken,
        user,
      );
    } catch (error) {
      throw new UnauthorizedException(
        '애플 로그인 토큰이 유효하지 않거나 위조되었습니다.',
        error.message,
      );
    }
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

    const tokens = await this.generateTokenAndUpdateRTR(user.id);
    return new LoginResponseDto(tokens.accessToken, tokens.refreshToken, user);
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

    return this.generateTokenAndUpdateRTR(userId);
  }

  async withdraw(userId: string) {
    await this.userService.deleteById(userId);
    return { message: 'User account deleted successfully' };
  }

  async deleteAppleUser(userId: string) {
    const user = await this.userService.findUserWithAppleRTById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.provider !== OauthProvider.APPLE) {
      throw new UnauthorizedException('User is not an Apple user');
    }

    if (user.appleRefreshToken) {
      await appleSignin.revokeAuthorizationToken(
        user.appleRefreshToken.appleRefreshToken,
        {
          clientID: this.configService.get<string>('APPLE_CLIENT_ID')!,
          clientSecret: this.appleSecretClient,
          tokenTypeHint: 'refresh_token',
        },
      );
    }

    await this.userService.deleteById(userId);
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
