import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '@src/auth/guards/jwt.guard';
import { CurrentUser } from '@src/auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('test')
  @UseGuards(JwtGuard)
  async sendTestNotification(@CurrentUser('id') userId: string) {
    await this.notificationsService.sendTestNotification(userId);
    return HttpStatus.OK;
  }
}
