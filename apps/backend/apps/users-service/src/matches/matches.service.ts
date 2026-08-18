import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateMatchPayload,
  ListByGroupPayload,
  MatchActionPayload,
  MatchDto,
  MatchSummaryDto,
  UpdateMatchStatusPayload,
} from '@ef/contracts';
import { GroupRepository } from '../groups/repositories/group.repository';
import { MatchRepository } from './repositories/match.repository';

type GroupRole = 'creator' | 'admin' | 'member';

@Injectable()
export class MatchesService {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly groupRepository: GroupRepository,
  ) {}

  async create(payload: CreateMatchPayload): Promise<MatchDto> {
    const { requesterId, originGroupId, opponentGroupId, type } = payload;

    await this.requireGroupExists(originGroupId);
    const requesterRole = await this.requireGroupMembership(originGroupId, requesterId);

    if (type === 'internal') {
      const match = await this.matchRepository.create({
        originGroupId,
        type: 'internal',
        format: payload.format,
        maxPlayers: payload.maxPlayers,
        status: 'scheduled',
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
        createdBy: requesterId,
      });
      return match;
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
    await this.requireGroupExists(opponentGroupId!);

    return this.matchRepository.create({
      originGroupId,
      opponentGroupId,
      type: 'vs',
      format: payload.format,
      maxPlayers: payload.maxPlayers,
      status: 'pending_opponent',
      scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
      createdBy: requesterId,
    });
  }

  async getDetail(payload: MatchActionPayload): Promise<MatchDto> {
    const match = await this.requireMatch(payload.matchId);
    await this.requireMemberOfEitherGroup(match, payload.requesterId);
    return this.matchRepository.findDetail(match.id) as Promise<MatchDto>;
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
    return this.matchRepository.findDetail(match.id) as Promise<MatchDto>;
  }

  async reject(payload: MatchActionPayload): Promise<MatchDto> {
    const match = await this.requireMatch(payload.matchId);
    this.requireVsPending(match);
    await this.requireOpponentLeadership(match, payload.requesterId);

    await this.matchRepository.updateStatus(match.id, 'cancelled');
    return this.matchRepository.findDetail(match.id) as Promise<MatchDto>;
  }

  async join(payload: MatchActionPayload): Promise<MatchDto> {
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

    const count = await this.matchRepository.countParticipants(match.id);
    if (count >= match.maxPlayers) {
      throw new ConflictException('Match already reached its player limit');
    }

    await this.matchRepository.addParticipant(match.id, payload.requesterId);
    return this.matchRepository.findDetail(match.id) as Promise<MatchDto>;
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
    return this.matchRepository.findDetail(match.id) as Promise<MatchDto>;
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
    return this.matchRepository.findDetail(match.id) as Promise<MatchDto>;
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
