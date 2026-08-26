import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { UserFriendshipsModule } from '../user-friendships/user-friendships.module';
import { UsersModule } from '../users/users.module';
import { ProfileStatsController } from './profile-stats.controller';
import { ProfileStatsService } from './profile-stats.service';
import { PhysicalTestResultRepository } from './repositories/physical-test-result.repository';
import { PlayerStatsRepository } from './repositories/player-stats.repository';
import { PsychAssessmentRepository } from './repositories/psych-assessment.repository';

@Module({
  imports: [UsersModule, GroupsModule, UserFriendshipsModule],
  controllers: [ProfileStatsController],
  providers: [
    ProfileStatsService,
    PlayerStatsRepository,
    PhysicalTestResultRepository,
    PsychAssessmentRepository,
  ],
})
export class ProfileStatsModule {}
