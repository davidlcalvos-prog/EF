import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GetPublicMemberProfilePayload,
  PhysicalTestResultDto,
  PlayerPositionId,
  PlayerStatsDto,
  ProfileStatsResponseDto,
  PsychAssessmentDto,
  PublicMemberProfileDto,
  SavePhysicalTestResultPayload,
  SavePsychAssessmentPayload,
  TEST_ID_TO_STAT_KEY,
} from '@ef/contracts';
import { GroupRepository } from '../groups/repositories/group.repository';
import { UserFriendshipsService } from '../user-friendships/user-friendships.service';
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
    private readonly groupRepository: GroupRepository,
    private readonly userFriendshipsService: UserFriendshipsService,
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

  /**
   * Ficha pública de un compañero de grupo. Solo nombre, avatar, posición y
   * el radar de stats — nunca psicológico ni tests crudos, a propósito.
   */
  async getPublicByUserId(
    payload: GetPublicMemberProfilePayload,
  ): Promise<PublicMemberProfileDto> {
    const { userId, requesterId } = payload;

    if (requesterId === userId) {
      throw new ForbiddenException(
        'Use the own profile endpoints to view yourself',
      );
    }

    // Fase 10: la ficha también es visible entre amigos aceptados (la
    // FriendsScreen abre perfiles de amigos que pueden no compartir grupo).
    const sharesGroup = await this.groupRepository.shareAnyGroup(
      requesterId,
      userId,
    );
    if (!sharesGroup) {
      const areFriends = await this.userFriendshipsService.areFriends(
        requesterId,
        userId,
      );
      if (!areFriends) {
        throw new ForbiddenException(
          'You can only view members of your own groups or your friends',
        );
      }
    }

    const profile = await this.userProfileRepository.findById(userId);
    if (!profile) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const [stats, favoritePosition] = await Promise.all([
      this.playerStatsRepository.findByUserId(userId),
      this.userProfileRepository.findFavoritePosition(userId),
    ]);

    return {
      userId: profile.id,
      name: profile.name,
      avatarBase64: profile.avatarBase64,
      favoritePosition: (favoritePosition as PlayerPositionId | null) ?? null,
      city: profile.city,
      department: profile.department,
      stats,
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
