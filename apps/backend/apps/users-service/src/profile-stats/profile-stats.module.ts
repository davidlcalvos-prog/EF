import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ProfileStatsController } from './profile-stats.controller';
import { ProfileStatsService } from './profile-stats.service';
import { PhysicalTestResultRepository } from './repositories/physical-test-result.repository';
import { PlayerStatsRepository } from './repositories/player-stats.repository';
import { PsychAssessmentRepository } from './repositories/psych-assessment.repository';

@Module({
  imports: [UsersModule],
  controllers: [ProfileStatsController],
  providers: [
    ProfileStatsService,
    PlayerStatsRepository,
    PhysicalTestResultRepository,
    PsychAssessmentRepository,
  ],
})
export class ProfileStatsModule {}
