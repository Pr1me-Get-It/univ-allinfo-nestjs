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
import { SaveExpoTokenDto } from './dto/save-expo-token.dto';
import { SetExpoTokenActiveDto } from './dto/set-expo-token-active.dto';
import { KeywordsDto } from './dto/keywords.dto';
import { SourcesDto } from './dto/sources.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('expo-token')
  @UseGuards(JwtGuard)
  async saveExpoToken(
    @CurrentUser('id') userId: string,
    @Body() dto: SaveExpoTokenDto,
  ) {
    await this.notificationsService.saveExpoToken(userId, dto.expoPushToken);
  }

  @Patch('expo-token')
  @UseGuards(JwtGuard)
  async setExpoTokenActive(
    @CurrentUser('id') userId: string,
    @Body() dto: SetExpoTokenActiveDto,
  ) {
    await this.notificationsService.setExpoTokenActive(
      userId,
      dto.expoPushToken,
      dto.isActive,
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
    @Body() dto: KeywordsDto,
  ) {
    return this.notificationsService.saveKeywords(userId, dto.keywords);
  }

  @Delete('keywords')
  @UseGuards(JwtGuard)
  async deleteKeywords(
    @CurrentUser('id') userId: string,
    @Body() dto: KeywordsDto,
  ) {
    return this.notificationsService.deleteKeywords(userId, dto.keywords);
  }

  @Get('sources')
  @UseGuards(JwtGuard)
  async getSources(@CurrentUser('id') userId: string) {
    return this.notificationsService.getSources(userId);
  }

  @Post('sources')
  @UseGuards(JwtGuard)
  async addSources(@CurrentUser('id') userId: string, @Body() dto: SourcesDto) {
    return this.notificationsService.saveSources(userId, dto.sources);
  }

  @Delete('sources')
  @UseGuards(JwtGuard)
  async deleteSources(
    @CurrentUser('id') userId: string,
    @Body() dto: SourcesDto,
  ) {
    return this.notificationsService.deleteSources(userId, dto.sources);
  }
}
