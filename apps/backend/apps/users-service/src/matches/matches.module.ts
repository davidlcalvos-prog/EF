import { Module } from '@nestjs/common';
import { GroupFriendshipsModule } from '../group-friendships/group-friendships.module';
import { GroupsModule } from '../groups/groups.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MatchRemindersService } from './match-reminders.service';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchReminderRepository } from './repositories/match-reminder.repository';
import { MatchRepository } from './repositories/match.repository';
import { VsMatchAlertsService } from './vs-match-alerts.service';

@Module({
  imports: [GroupsModule, GroupFriendshipsModule, NotificationsModule],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    MatchRepository,
    MatchReminderRepository,
    VsMatchAlertsService,
    // Recordatorios 12 h / 3 h (2026-09-10): @Cron cada 5 min, ScheduleModule ya está en AppModule.
    MatchRemindersService,
  ],
  // MatchRepository: la usa MatchGuestRequestsModule (Fase 11) para countParticipants/isParticipant.
  exports: [MatchRepository],
})
export class MatchesModule {}
