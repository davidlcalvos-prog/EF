import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  SavePhysicalTestResultPayload,
  SavePsychAssessmentPayload,
  UserIdPayload,
} from '@ef/contracts';
import { ProfileStatsService } from './profile-stats.service';

@Controller()
export class ProfileStatsController {
  constructor(private readonly profileStatsService: ProfileStatsService) {}

  @MessagePattern(MESSAGE_PATTERNS.PROFILE_STATS.GET_MINE)
  getMine(@Payload() data: UserIdPayload) {
    return this.profileStatsService.getMine(data.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.PROFILE_STATS.SAVE_PHYSICAL_TEST_RESULT)
  savePhysicalTestResult(@Payload() data: SavePhysicalTestResultPayload) {
    return this.profileStatsService.savePhysicalTestResult(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.PROFILE_STATS.SAVE_PSYCH_ASSESSMENT)
  savePsychAssessment(@Payload() data: SavePsychAssessmentPayload) {
    return this.profileStatsService.savePsychAssessment(data);
  }
}
