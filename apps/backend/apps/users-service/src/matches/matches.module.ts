import { Module } from '@nestjs/common';
import { GroupFriendshipsModule } from '../group-friendships/group-friendships.module';
import { GroupsModule } from '../groups/groups.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchRepository } from './repositories/match.repository';
import { VsMatchAlertsService } from './vs-match-alerts.service';

@Module({
  imports: [GroupsModule, GroupFriendshipsModule, NotificationsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchRepository, VsMatchAlertsService],
})
export class MatchesModule {}
