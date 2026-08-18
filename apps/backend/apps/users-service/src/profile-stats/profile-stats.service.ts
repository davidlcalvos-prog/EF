import { ConflictException, Injectable } from '@nestjs/common';
import {
  PhysicalTestResultDto,
  PlayerPositionId,
  PlayerStatsDto,
  ProfileStatsResponseDto,
  PsychAssessmentDto,
  SavePhysicalTestResultPayload,
  SavePsychAssessmentPayload,
  TEST_ID_TO_STAT_KEY,
} from '@ef/contracts';
import { UserProfileRepository } from '../users/repositories/user-profile.repository';
import { PhysicalTestResultRepository } from './repositories/physical-test-result.repository';
import { PlayerStatsRepository } from './repositories/player-stats.repository';
import { PsychAssessmentRepository } from './repositories/psych-assessment.repository';

@Injectable()
export class ProfileStatsService {
  constructor(
    private readonly playerStatsRepository: PlayerStatsRepository,
    private readonly physicalTestResultRepository: PhysicalTestResultRepository,
    private readonly psychAssessmentRepository: PsychAssessmentRepository,
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async getMine(userId: string): Promise<ProfileStatsResponseDto> {
    const [stats, latestTestResults, latestPsychAssessment, favoritePosition] =
      await Promise.all([
        this.playerStatsRepository.findByUserId(userId),
        this.physicalTestResultRepository.findLatestPerTest(userId),
        this.psychAssessmentRepository.findLatest(userId),
        this.userProfileRepository.findFavoritePosition(userId),
      ]);

    return {
      stats,
      latestTestResults,
      latestPsychAssessment,
      favoritePosition: (favoritePosition as PlayerPositionId | null) ?? null,
    };
  }

  async savePhysicalTestResult(
    payload: SavePhysicalTestResultPayload,
  ): Promise<{ testResult: PhysicalTestResultDto; stats: PlayerStatsDto }> {
    const { userId, testId, rawData, score } = payload;

    const locked = await this.physicalTestResultRepository.isLockedThisMonth(
      userId,
      testId,
    );
    if (locked) {
      throw new ConflictException(
        `Physical test '${testId}' already completed this month`,
      );
    }

    const testResult = await this.physicalTestResultRepository.create(
      userId,
      testId,
      rawData,
      score,
    );

    const statKey = TEST_ID_TO_STAT_KEY[testId];
    const stats = await this.playerStatsRepository.applyTestScore(
      userId,
      statKey,
      score,
    );

    return { testResult, stats };
  }

  async savePsychAssessment(
    payload: SavePsychAssessmentPayload,
  ): Promise<PsychAssessmentDto> {
    const { userId, answers, teamworkScore, onFieldScore, overallScore, traits } =
      payload;

    const locked = await this.psychAssessmentRepository.isLockedThisMonth(userId);
    if (locked) {
      throw new ConflictException(
        'Psychological assessment already completed this month',
      );
    }

    return this.psychAssessmentRepository.create(
      userId,
      answers,
      teamworkScore,
      onFieldScore,
      overallScore,
      traits,
    );
  }
}
