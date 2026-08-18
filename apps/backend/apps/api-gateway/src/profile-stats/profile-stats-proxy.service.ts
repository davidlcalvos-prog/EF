import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  PhysicalTestId,
  PhysicalTestResultDto,
  PlayerStatsDto,
  ProfileStatsResponseDto,
  PsychAssessmentDto,
  SavePhysicalTestResultDto,
  SavePsychAssessmentDto,
} from '@ef/contracts';

@Injectable()
export class ProfileStatsProxyService {
  constructor(
    @Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy,
  ) {}

  getMine(userId: string): Promise<ProfileStatsResponseDto> {
    return this.send<ProfileStatsResponseDto>(
      MESSAGE_PATTERNS.PROFILE_STATS.GET_MINE,
      { userId },
    );
  }

  savePhysicalTestResult(
    userId: string,
    testId: PhysicalTestId,
    dto: SavePhysicalTestResultDto,
  ): Promise<{ testResult: PhysicalTestResultDto; stats: PlayerStatsDto }> {
    return this.send(MESSAGE_PATTERNS.PROFILE_STATS.SAVE_PHYSICAL_TEST_RESULT, {
      userId,
      testId,
      ...dto,
    });
  }

  savePsychAssessment(
    userId: string,
    dto: SavePsychAssessmentDto,
  ): Promise<PsychAssessmentDto> {
    return this.send<PsychAssessmentDto>(
      MESSAGE_PATTERNS.PROFILE_STATS.SAVE_PSYCH_ASSESSMENT,
      { userId, ...dto },
    );
  }

  private send<T>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.usersClient.send<T>(pattern, payload).pipe(
        catchError((error: unknown) =>
          throwError(() => toHttpException(error)),
        ),
      ),
    );
  }
}
