import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpoToken } from './entities/expo-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExpoToken])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
