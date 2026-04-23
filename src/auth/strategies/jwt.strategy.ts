import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // 일단 id, sub 둘 다 리턴하는데, 나중에 케이스 다 확인해서 통일하기
    return { id: payload.sub, sub: payload.sub };
  }
}
