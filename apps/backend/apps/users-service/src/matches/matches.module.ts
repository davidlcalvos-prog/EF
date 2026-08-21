import { Module } from '@nestjs/common';
import { GroupFriendshipsModule } from '../group-friendships/group-friendships.module';
import { GroupsModule } from '../groups/groups.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchRepository } from './repositories/match.repository';

@Module({
  imports: [GroupsModule, GroupFriendshipsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchRepository],
})
export class MatchesModule {}
