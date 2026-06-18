import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtGuard } from './guards/jwt.guard';
import { LoginResponseDto } from './dto/login-response.dto';
import { AppleLoginDto } from './dto/apple-login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('apple')
  async appleLogin(@Body() dto: AppleLoginDto): Promise<LoginResponseDto> {
    return this.authService.appleLogin(dto.idToken, dto.authorizationCode);
  }

  @Post('google')
  async googleAuth(@Body() dto: GoogleLoginDto): Promise<LoginResponseDto> {
    return this.authService.googleLogin(dto.idToken);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refreshTokens(@Req() req, @Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(req.user.sub, dto.refreshToken);
  }

  @Delete('withdraw')
  @UseGuards(JwtGuard)
  async withdraw(@Req() req) {
    return this.authService.withdraw(req.user.sub);
  }
}
