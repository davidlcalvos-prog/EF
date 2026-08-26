import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserFriendshipsController } from './user-friendships.controller';
import { UserFriendshipsService } from './user-friendships.service';
import { UserFriendshipRepository } from './repositories/user-friendship.repository';

@Module({
  imports: [NotificationsModule],
  controllers: [UserFriendshipsController],
  providers: [UserFriendshipsService, UserFriendshipRepository],
  exports: [UserFriendshipsService, UserFriendshipRepository],
})
export class UserFriendshipsModule {}
