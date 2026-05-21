import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtGuard } from './guards/jwt.guard';
import { LoginResponseDto } from './dto/login-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('apple')
  async appleLogin(
    @Body('idToken') idToken: string,
    @Body('authorizationCode') authorizationCode: string,
  ): Promise<LoginResponseDto> {
    return await this.authService.appleLogin(idToken, authorizationCode);
  }

  @Post('google')
  async googleAuth(
    @Body('idToken') idToken: string,
  ): Promise<LoginResponseDto> {
    return await this.authService.googleLogin(idToken);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refreshTokens(@Req() req, @Body('refreshToken') refreshToken: string) {
    const userId = req.user.sub;
    return await this.authService.refreshTokens(userId, refreshToken);
  }

  @Delete('withdraw')
  @UseGuards(JwtGuard)
  async withdraw(@Req() req) {
    const userId = req.user.sub;
    return await this.authService.withdraw(userId);
  }
}
