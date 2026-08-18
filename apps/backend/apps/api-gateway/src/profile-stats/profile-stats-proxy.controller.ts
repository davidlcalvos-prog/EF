import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  AuthTokenPayload,
  PHYSICAL_TEST_IDS,
  PhysicalTestId,
  SavePhysicalTestResultDto,
  SavePsychAssessmentDto,
  UpdateProfileDto,
} from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersProxyService } from '../users/users-proxy.service';
import { ProfileStatsProxyService } from './profile-stats-proxy.service';

function assertValidTestId(testId: string): asserts testId is PhysicalTestId {
  if (!PHYSICAL_TEST_IDS.includes(testId as PhysicalTestId)) {
    throw new BadRequestException(`Unknown physical test id: ${testId}`);
  }
}

/**
 * Perfil "rico" del jugador (stats, tests físicos, evaluación psicológica).
 * Siempre self — no hay parámetro :id, se resuelve por el sub del JWT.
 */
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileStatsProxyController {
  constructor(
    private readonly profileStatsProxy: ProfileStatsProxyService,
    private readonly usersProxy: UsersProxyService,
  ) {}

  @Get('stats')
  getMine(@CurrentUser() user: AuthTokenPayload) {
    return this.profileStatsProxy.getMine(user.sub);
  }

  @Put('physical-tests/:testId')
  savePhysicalTestResult(
    @Param('testId') testId: string,
    @Body() dto: SavePhysicalTestResultDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    assertValidTestId(testId);
    return this.profileStatsProxy.savePhysicalTestResult(user.sub, testId, dto);
  }

  @Put('psych-assessment')
  savePsychAssessment(
    @Body() dto: SavePsychAssessmentDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.profileStatsProxy.savePsychAssessment(user.sub, dto);
  }

  @Patch()
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.usersProxy.updateProfile(user.sub, dto);
  }
}
