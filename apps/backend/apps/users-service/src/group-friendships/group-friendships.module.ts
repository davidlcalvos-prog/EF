import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { GroupFriendshipsController } from './group-friendships.controller';
import { GroupFriendshipsService } from './group-friendships.service';
import { GroupFriendshipRepository } from './repositories/group-friendship.repository';

@Module({
  imports: [GroupsModule],
  controllers: [GroupFriendshipsController],
  providers: [GroupFriendshipsService, GroupFriendshipRepository],
  exports: [GroupFriendshipsService],
})
export class GroupFriendshipsModule {}
