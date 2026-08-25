import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { UserPreferencesRepository } from './repositories/user-preferences.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UserProfileRepository,
    UserPreferencesRepository,
  ],
  exports: [UserProfileRepository],
})
export class UsersModule {}
