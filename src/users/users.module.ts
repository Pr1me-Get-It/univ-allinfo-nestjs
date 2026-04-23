import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { AuthModule } from '@src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
