import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GroupFriendshipActionPayload,
  GroupFriendshipDto,
  ListGroupFriendshipsPayload,
  RequestGroupFriendshipPayload,
} from '@ef/contracts';
import { GroupRepository } from '../groups/repositories/group.repository';
import { GroupFriendshipRepository } from './repositories/group-friendship.repository';

type GroupRole = 'creator' | 'admin' | 'member';

@Injectable()
export class GroupFriendshipsService {
  constructor(
    private readonly friendshipRepository: GroupFriendshipRepository,
    private readonly groupRepository: GroupRepository,
  ) {}

  async request(payload: RequestGroupFriendshipPayload): Promise<GroupFriendshipDto> {
    const { groupId, targetGroupId, requesterId } = payload;

    if (groupId === targetGroupId) {
      throw new BadRequestException('targetGroupId must be different from groupId');
    }
    await this.requireGroupExists(groupId);
    await this.requireGroupExists(targetGroupId);
    await this.requireLeadership(groupId, requesterId);

    const [groupAId, groupBId] = this.canonicalize(groupId, targetGroupId);
    const existing = await this.friendshipRepository.findByPair(groupAId, groupBId);
    if (existing) {
      throw new ConflictException(
        existing.status === 'accepted'
          ? 'These groups are already friends'
          : 'A friendship request between these groups is already pending',
      );
    }

    return this.friendshipRepository.create(groupAId, groupBId, groupId);
  }

  async accept(payload: GroupFriendshipActionPayload): Promise<GroupFriendshipDto> {
    const friendship = await this.requireFriendship(payload.friendshipId);
    if (friendship.status !== 'pending') {
      throw new ConflictException('This friendship request is not pending');
    }

    const respondingGroupId =
      friendship.groupAId === friendship.requestedByGroupId
        ? friendship.groupBId
        : friendship.groupAId;
    await this.requireLeadership(respondingGroupId, payload.requesterId);

    return this.friendshipRepository.accept(friendship.id);
  }

  async remove(payload: GroupFriendshipActionPayload): Promise<{ success: true }> {
    const friendship = await this.requireFriendship(payload.friendshipId);

    const requesterRoleA = await this.groupRepository.findMembership(
      friendship.groupAId,
      payload.requesterId,
    );
    const requesterRoleB = await this.groupRepository.findMembership(
      friendship.groupBId,
      payload.requesterId,
    );
    const canManage =
      this.isGroupLeader(requesterRoleA?.role as GroupRole | undefined) ||
      this.isGroupLeader(requesterRoleB?.role as GroupRole | undefined);
    if (!canManage) {
      throw new ForbiddenException(
        'Only the creator or an admin of one of the groups can end this friendship',
      );
    }

    await this.friendshipRepository.remove(friendship.id);
    return { success: true };
  }

  async listForGroup(payload: ListGroupFriendshipsPayload): Promise<GroupFriendshipDto[]> {
    await this.requireGroupExists(payload.groupId);
    const membership = await this.groupRepository.findMembership(
      payload.groupId,
      payload.requesterId,
    );
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
    return this.friendshipRepository.listForGroup(payload.groupId);
  }

  /** Usado por MatchesService al crear un partido 'vs' — la amistad solo se valida al crear. */
  async areFriends(groupIdA: string, groupIdB: string): Promise<boolean> {
    const [groupAId, groupBId] = this.canonicalize(groupIdA, groupIdB);
    return this.friendshipRepository.existsAccepted(groupAId, groupBId);
  }

  private canonicalize(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  private isGroupLeader(role?: GroupRole): boolean {
    return role === 'creator' || role === 'admin';
  }

  private async requireGroupExists(groupId: string): Promise<void> {
    const group = await this.groupRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }
  }

  private async requireLeadership(groupId: string, userId: string): Promise<void> {
    const membership = await this.groupRepository.findMembership(groupId, userId);
    if (!this.isGroupLeader(membership?.role as GroupRole | undefined)) {
      throw new ForbiddenException(
        'Only the creator or an admin of the group can do that',
      );
    }
  }

  private async requireFriendship(friendshipId: string): Promise<GroupFriendshipDto> {
    const friendship = await this.friendshipRepository.findById(friendshipId);
    if (!friendship) {
      throw new NotFoundException(`Friendship ${friendshipId} not found`);
    }
    return friendship;
  }
}
