import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { UserPreferencesRepository } from './repositories/user-preferences.repository';
import {
  UserPreferences,
  UserPreferencesSchema,
} from './schemas/user-preferences.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPreferences.name, schema: UserPreferencesSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserProfileRepository,
    UserPreferencesRepository,
  ],
  exports: [UserProfileRepository],
})
export class UsersModule {}
