import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateMatchPayload,
  JoinMatchPayload,
  ListByGroupPayload,
  MatchActionPayload,
  MatchDto,
  MatchSide,
  MatchSummaryDto,
  RandomizeTeamsPayload,
  RandomizeTeamsResultDto,
  RANDOMIZE_TEAMS_ERRORS,
  UpdateMatchStatusPayload,
} from '@ef/contracts';
import { GroupFriendshipsService } from '../group-friendships/group-friendships.service';
import { GroupRepository } from '../groups/repositories/group.repository';
import { MatchRepository } from './repositories/match.repository';
import { randomizeTeams as computeTeamAssignments } from './team-randomizer';

type GroupRole = 'creator' | 'admin' | 'member';

@Injectable()
export class MatchesService {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly groupRepository: GroupRepository,
    private readonly groupFriendshipsService: GroupFriendshipsService,
  ) {}

  async create(payload: CreateMatchPayload): Promise<MatchDto> {
    const { requesterId, originGroupId, opponentGroupId, type } = payload;

    await this.requireGroupExists(originGroupId);
    const requesterRole = await this.requireGroupMembership(originGroupId, requesterId);

    if (type === 'internal') {
      return this.matchRepository.create({
        originGroupId,
        type: 'internal',
        format: payload.format,
        maxPlayers: payload.maxPlayers,
        status: 'scheduled',
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
        createdBy: requesterId,
      });
    }

    // type === 'vs'
    if (!this.isGroupLeader(requesterRole)) {
      throw new ForbiddenException(
        'Only the creator or an admin can create a VS match',
      );
    }
    if (opponentGroupId === originGroupId) {
      throw new BadRequestException('opponentGroupId must be different from originGroupId');
    }
    if (payload.maxPlayers % 2 !== 0) {
      throw new BadRequestException(
        'maxPlayers must be even for a VS match — capacity is split evenly between both sides',
      );
    }
    await this.requireGroupExists(opponentGroupId!);

    const areFriends = await this.groupFriendshipsService.areFriends(
      originGroupId,
      opponentGroupId!,
    );
    if (!areFriends) {
      throw new ForbiddenException('Groups must be friends to create a VS match');
    }

    const match = await this.matchRepository.create({
      originGroupId,
      opponentGroupId,
      type: 'vs',
      format: payload.format,
      maxPlayers: payload.maxPlayers,
      status: 'pending_opponent',
      scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
      createdBy: requesterId,
    });
    return this.applyVisibility(match, requesterId);
  }

  async getDetail(payload: MatchActionPayload): Promise<MatchDto> {
    const match = await this.requireMatch(payload.matchId);
    await this.requireMemberOfEitherGroup(match, payload.requesterId);
    const detail = (await this.matchRepository.findDetail(match.id)) as MatchDto;
    return this.applyVisibility(detail, payload.requesterId);
  }

  async listMine(userId: string): Promise<MatchSummaryDto[]> {
    const groups = await this.groupRepository.listForUser(userId);
    return this.matchRepository.listMineForUser(
      userId,
      groups.map((g) => g.id),
    );
  }

  async listByGroup(payload: ListByGroupPayload): Promise<MatchSummaryDto[]> {
    await this.requireGroupExists(payload.groupId);
    await this.requireGroupMembership(payload.groupId, payload.requesterId);
    return this.matchRepository.listByGroup(payload.groupId);
  }

  async accept(payload: MatchActionPayload): Promise<MatchDto> {
    const match = await this.requireMatch(payload.matchId);
    this.requireVsPending(match);
    await this.requireOpponentLeadership(match, payload.requesterId);

    await this.matchRepository.updateStatus(match.id, 'scheduled');
    const detail = (await this.matchRepository.findDetail(match.id)) as MatchDto;
    return this.applyVisibility(detail, payload.requesterId);
  }

  async reject(payload: MatchActionPayload): Promise<MatchDto> {
    const match = await this.requireMatch(payload.matchId);
    this.requireVsPending(match);
    await this.requireOpponentLeadership(match, payload.requesterId);

    await this.matchRepository.updateStatus(match.id, 'cancelled');
    const detail = (await this.matchRepository.findDetail(match.id)) as MatchDto;
    return this.applyVisibility(detail, payload.requesterId);
  }

  async join(payload: JoinMatchPayload): Promise<MatchDto> {
    const match = await this.requireMatch(payload.matchId);

    if (match.status !== 'scheduled') {
      throw new ConflictException('Match is not open for joining');
    }
    await this.requireMemberOfEitherGroup(match, payload.requesterId);

    const alreadyJoined = await this.matchRepository.isParticipant(
      match.id,
      payload.requesterId,
    );
    if (alreadyJoined) {
      throw new ConflictException('You already joined this match');
    }

    if (match.type === 'vs') {
      const side = await this.resolveJoinSide(match, payload.requesterId, payload.joinAsGroupId);
      const sideCapacity = match.maxPlayers / 2;
      const sideCount = await this.matchRepository.countParticipantsBySide(match.id, side);
      if (sideCount >= sideCapacity) {
        throw new ConflictException('This side of the match is already full');
      }
      await this.matchRepository.addVsParticipant(match.id, payload.requesterId, side, sideCapacity);
    } else {
      const count = await this.matchRepository.countParticipants(match.id);
      if (count >= match.maxPlayers) {
        throw new ConflictException('Match already reached its player limit');
      }
      await this.matchRepository.addParticipant(match.id, payload.requesterId);
    }

    const detail = (await this.matchRepository.findDetail(match.id)) as MatchDto;
    return this.applyVisibility(detail, payload.requesterId);
  }

  async leave(payload: MatchActionPayload): Promise<MatchDto> {
    const match = await this.requireMatch(payload.matchId);

    const isParticipant = await this.matchRepository.isParticipant(
      match.id,
      payload.requesterId,
    );
    if (!isParticipant) {
      throw new NotFoundException('You are not a participant of this match');
    }

    await this.matchRepository.removeParticipant(match.id, payload.requesterId);
    const detail = (await this.matchRepository.findDetail(match.id)) as MatchDto;
    return this.applyVisibility(detail, payload.requesterId);
  }

  async updateStatus(payload: UpdateMatchStatusPayload): Promise<MatchDto> {
    const match = await this.requireMatch(payload.matchId);

    const originRole = await this.groupRepository.findMembership(
      match.originGroupId,
      payload.requesterId,
    );
    const opponentRole = match.opponentGroupId
      ? await this.groupRepository.findMembership(
          match.opponentGroupId,
          payload.requesterId,
        )
      : null;

    const canManage =
      this.isGroupLeader(originRole?.role) || this.isGroupLeader(opponentRole?.role);
    if (!canManage) {
      throw new ForbiddenException(
        'Only the creator or an admin of a participating group can update the match status',
      );
    }

    await this.matchRepository.updateStatus(match.id, payload.status);
    const detail = (await this.matchRepository.findDetail(match.id)) as MatchDto;
    return this.applyVisibility(detail, payload.requesterId);
  }

  /**
   * Si el requester es miembro de un solo grupo de los dos, el lado se infiere.
   * Si es de los dos, joinAsGroupId es obligatorio y debe ser uno de los dos.
   */
  private async resolveJoinSide(
    match: { originGroupId: string; opponentGroupId: string | null },
    requesterId: string,
    joinAsGroupId?: string,
  ): Promise<MatchSide> {
    const originMembership = await this.groupRepository.findMembership(
      match.originGroupId,
      requesterId,
    );
    const opponentMembership = match.opponentGroupId
      ? await this.groupRepository.findMembership(match.opponentGroupId, requesterId)
      : null;

    const isOrigin = !!originMembership;
    const isOpponent = !!opponentMembership;

    if (isOrigin && isOpponent) {
      if (!joinAsGroupId) {
        throw new BadRequestException(
          'You are a member of both groups — specify joinAsGroupId',
        );
      }
      if (joinAsGroupId === match.originGroupId) return 'origin';
      if (joinAsGroupId === match.opponentGroupId) return 'opponent';
      throw new BadRequestException('joinAsGroupId must be one of the two groups in this match');
    }
    if (isOrigin) return 'origin';
    if (isOpponent) return 'opponent';

    // requireMemberOfEitherGroup ya se llamó antes en join(); esto no debería alcanzarse.
    throw new ForbiddenException('You are not a member of either group involved in this match');
  }

  /**
   * Partidos vs sin roster confirmado: un lado solo ve su propia planilla
   * completa, del rival solo el conteo (ya viaja en originSideCount/
   * opponentSideCount) — un cambio real de qué datos viajan por la red, no
   * solo de qué pinta el mobile.
   */
  private async applyVisibility(match: MatchDto, requesterId: string): Promise<MatchDto> {
    if (match.type !== 'vs' || match.rosterConfirmedAt) return match;

    const originMembership = await this.groupRepository.findMembership(
      match.originGroupId,
      requesterId,
    );
    const requesterSide: MatchSide | null = originMembership
      ? 'origin'
      : match.opponentGroupId &&
          (await this.groupRepository.findMembership(match.opponentGroupId, requesterId))
        ? 'opponent'
        : null;

    return {
      ...match,
      participants: match.participants.filter((p) => p.side === requesterSide),
    };
  }

  /**
   * Solo internal, solo creator/admin del originGroupId, y solo si el partido
   * está lleno y en 'scheduled'. Re-ejecutable: pisa el reparto anterior.
   */
  async randomizeTeams(payload: RandomizeTeamsPayload): Promise<RandomizeTeamsResultDto> {
    const match = await this.requireMatch(payload.matchId);
    const requesterRole = await this.requireGroupMembership(
      match.originGroupId,
      payload.requesterId,
    );
    if (!this.isGroupLeader(requesterRole)) {
      throw new ForbiddenException(
        'Only the creator or an admin can randomize teams',
      );
    }

    if (match.type !== 'internal') {
      throw new BadRequestException(
        'Only internal matches support team randomization',
      );
    }
    if (match.status !== 'scheduled') {
      throw new ConflictException(RANDOMIZE_TEAMS_ERRORS.INVALID_STATUS);
    }

    const participantCount = await this.matchRepository.countParticipants(match.id);
    if (participantCount !== match.maxPlayers) {
      throw new ConflictException(RANDOMIZE_TEAMS_ERRORS.NOT_FULL);
    }

    const players = await this.matchRepository.findParticipantsForRandomization(match.id);
    const { assignments, warnings } = computeTeamAssignments(players);
    await this.matchRepository.persistTeamAssignments(match.id, assignments);

    return {
      match: (await this.matchRepository.findDetail(match.id)) as MatchDto,
      warnings,
    };
  }

  private isGroupLeader(role?: GroupRole): boolean {
    return role === 'creator' || role === 'admin';
  }

  private requireVsPending(match: { type: string; status: string }): void {
    if (match.type !== 'vs' || match.status !== 'pending_opponent') {
      throw new ConflictException(
        'Match is not a VS challenge pending opponent confirmation',
      );
    }
  }

  private async requireMatch(matchId: string) {
    const match = await this.matchRepository.findCore(matchId);
    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }
    return match;
  }

  private async requireGroupExists(groupId: string) {
    const group = await this.groupRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }
    return group;
  }

  private async requireGroupMembership(
    groupId: string,
    userId: string,
  ): Promise<GroupRole> {
    const membership = await this.groupRepository.findMembership(groupId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
    return membership.role as GroupRole;
  }

  private async requireMemberOfEitherGroup(
    match: { originGroupId: string; opponentGroupId: string | null },
    userId: string,
  ): Promise<void> {
    const originMembership = await this.groupRepository.findMembership(
      match.originGroupId,
      userId,
    );
    if (originMembership) return;

    if (match.opponentGroupId) {
      const opponentMembership = await this.groupRepository.findMembership(
        match.opponentGroupId,
        userId,
      );
      if (opponentMembership) return;
    }

    throw new ForbiddenException(
      'You are not a member of either group involved in this match',
    );
  }

  private async requireOpponentLeadership(
    match: { opponentGroupId: string | null },
    userId: string,
  ): Promise<void> {
    if (!match.opponentGroupId) {
      throw new ConflictException('Match has no opponent group');
    }
    const membership = await this.groupRepository.findMembership(
      match.opponentGroupId,
      userId,
    );
    if (!this.isGroupLeader(membership?.role as GroupRole | undefined)) {
      throw new ForbiddenException(
        'Only the creator or an admin of the challenged group can respond',
      );
    }
  }
}
