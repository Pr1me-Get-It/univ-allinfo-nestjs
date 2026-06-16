import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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

  @Patch('expo-token')
  @UseGuards(JwtGuard)
  async setExpoTokenActive(
    @CurrentUser('id') userId: string,
    @Body('expoPushToken') expoPushToken: string,
    @Body('isActive') isActive: boolean,
  ) {
    await this.notificationsService.setExpoTokenActive(
      userId,
      expoPushToken,
      isActive,
    );
  }

  @Get('keywords')
  @UseGuards(JwtGuard)
  async getKeywords(@CurrentUser('id') userId: string) {
    return this.notificationsService.getKeywords(userId);
  }

  @Post('keywords')
  @UseGuards(JwtGuard)
  async addKeywords(
    @CurrentUser('id') userId: string,
    @Body('keywords') keywords: string[],
  ) {
    return await this.notificationsService.saveKeywords(userId, keywords);
  }

  @Delete('keywords')
  @UseGuards(JwtGuard)
  async deleteKeywords(
    @CurrentUser('id') userId: string,
    @Body('keywords') keywords: string[],
  ) {
    return await this.notificationsService.deleteKeywords(userId, keywords);
  }

  @Get('sources')
  @UseGuards(JwtGuard)
  async getSources(@CurrentUser('id') userId: string) {
    return this.notificationsService.getSources(userId);
  }

  @Post('sources')
  @UseGuards(JwtGuard)
  async addSources(
    @CurrentUser('id') userId: string,
    @Body('sources') sources: string[],
  ) {
    return await this.notificationsService.saveSources(userId, sources);
  }

  @Delete('sources')
  @UseGuards(JwtGuard)
  async deleteSources(
    @CurrentUser('id') userId: string,
    @Body('sources') sources: string[],
  ) {
    return await this.notificationsService.deleteSources(userId, sources);
  }
}
