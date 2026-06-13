import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { JwtGuard } from '@src/auth/guards/jwt.guard';
import { CurrentUser } from '@src/auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('expo-token')
  @UseGuards(JwtGuard)
  async saveExpoToken(
    @CurrentUser('id') userId: string,
    @Body('expoPushToken') expoPushToken: string,
  ) {
    await this.notificationsService.saveExpoToken(userId, expoPushToken);
  }

  @Post('keyword')
  @UseGuards(JwtGuard)
  async addKeywords(
    @CurrentUser('id') userId: string,
    @Body('keywords') keywords: string[],
  ) {
    return await this.notificationsService.saveKeywords(userId, keywords);
  }

  @Post('source')
  @UseGuards(JwtGuard)
  async addSources(
    @CurrentUser('id') userId: string,
    @Body('sources') sources: string[],
  ) {
    return await this.notificationsService.saveSources(userId, sources);
  }
}
