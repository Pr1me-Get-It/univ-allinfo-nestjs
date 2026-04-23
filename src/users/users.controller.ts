import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '@src/auth/decorators/current-user.decorator';
import { JwtGuard } from '@src/auth/guards/jwt.guard';
import { UserProfile } from './entities/user-profile.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  async getUser(@CurrentUser('id') userId: string) {
    return await this.usersService.findById(userId);
  }

  @Get('me/profile')
  @UseGuards(JwtGuard)
  async getUserProfile(@CurrentUser('id') userId: string) {
    return await this.usersService.findProfileById(userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtGuard)
  async updateUserProfile(
    @CurrentUser('id') userId: string,
    @Body() profileData: Partial<UserProfile>,
  ) {
    return await this.usersService.updateProfile(userId, profileData);
  }
}
