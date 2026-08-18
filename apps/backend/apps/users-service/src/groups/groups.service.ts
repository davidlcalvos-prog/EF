import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddMemberPayload,
  CreateGroupPayload,
  GroupActionPayload,
  GroupDetailDto,
  GroupSummaryDto,
  MAX_GROUP_ADMINS,
  RemoveMemberPayload,
  UpdateMemberRolePayload,
} from '@ef/contracts';
import { GroupRepository } from './repositories/group.repository';

@Injectable()
export class GroupsService {
  constructor(private readonly groupRepository: GroupRepository) {}

  create(payload: CreateGroupPayload): Promise<GroupDetailDto> {
    return this.groupRepository.create(payload.creatorId, payload.name);
  }

  listMine(userId: string): Promise<GroupSummaryDto[]> {
    return this.groupRepository.listForUser(userId);
  }

  async getDetail(payload: GroupActionPayload): Promise<GroupDetailDto> {
    await this.requireMembership(payload.groupId, payload.requesterId);
    return this.groupRepository.findDetail(payload.groupId) as Promise<GroupDetailDto>;
  }

  async addMember(payload: AddMemberPayload): Promise<GroupDetailDto> {
    const { groupId, requesterId, userId, email } = payload;
    const requesterRole = await this.requireMembership(groupId, requesterId);

    if (requesterRole !== 'creator' && requesterRole !== 'admin') {
      throw new ForbiddenException('Only the creator or an admin can add members');
    }

    const targetUserId = userId ?? (await this.resolveUserIdByEmail(email!));

    const existing = await this.groupRepository.findMembership(groupId, targetUserId);
    if (existing) {
      throw new ConflictException('User is already a member of this group');
    }

    await this.groupRepository.addMembership(groupId, targetUserId, 'member');
    return this.groupRepository.findDetail(groupId) as Promise<GroupDetailDto>;
  }

  async updateMemberRole(payload: UpdateMemberRolePayload): Promise<GroupDetailDto> {
    const { groupId, requesterId, targetUserId, role } = payload;
    const group = await this.requireGroup(groupId);

    if (requesterId !== group.creatorId) {
      throw new ForbiddenException('Only the creator can change member roles');
    }
    if (targetUserId === group.creatorId) {
      throw new ForbiddenException("The creator's role cannot be changed");
    }

    const targetMembership = await this.groupRepository.findMembership(
      groupId,
      targetUserId,
    );
    if (!targetMembership) {
      throw new NotFoundException('User is not a member of this group');
    }

    if (role === 'admin' && targetMembership.role !== 'admin') {
      const adminCount = await this.groupRepository.countAdmins(groupId);
      if (adminCount >= MAX_GROUP_ADMINS) {
        throw new ConflictException(
          `Group already has ${MAX_GROUP_ADMINS} admins`,
        );
      }
    }

    await this.groupRepository.updateMembershipRole(groupId, targetUserId, role);
    return this.groupRepository.findDetail(groupId) as Promise<GroupDetailDto>;
  }

  async removeMember(payload: RemoveMemberPayload): Promise<void> {
    const { groupId, requesterId, targetUserId } = payload;
    const requesterRole = await this.requireMembership(groupId, requesterId);

    const isSelfRemoval = requesterId === targetUserId;

    if (isSelfRemoval) {
      if (requesterRole === 'creator') {
        throw new ForbiddenException(
          'The creator cannot leave their own group in this phase',
        );
      }
      await this.groupRepository.removeMembership(groupId, targetUserId);
      return;
    }

    const targetMembership = await this.groupRepository.findMembership(
      groupId,
      targetUserId,
    );
    if (!targetMembership) {
      throw new NotFoundException('User is not a member of this group');
    }

    if (requesterRole === 'creator') {
      // El creador puede quitar a cualquiera (admin o member), menos a sí mismo.
    } else if (requesterRole === 'admin') {
      if (targetMembership.role !== 'member') {
        throw new ForbiddenException(
          'Admins can only remove regular members, not other admins or the creator',
        );
      }
    } else {
      throw new ForbiddenException('Only the creator or an admin can remove members');
    }

    await this.groupRepository.removeMembership(groupId, targetUserId);
  }

  async deleteGroup(payload: GroupActionPayload): Promise<void> {
    const group = await this.requireGroup(payload.groupId);
    if (payload.requesterId !== group.creatorId) {
      throw new ForbiddenException('Only the creator can delete the group');
    }
    await this.groupRepository.deleteGroup(payload.groupId);
  }

  private async requireGroup(groupId: string) {
    const group = await this.groupRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }
    return group;
  }

  /** Confirma que el usuario pertenece al grupo (403 si no) y devuelve su rol. */
  private async requireMembership(groupId: string, userId: string) {
    await this.requireGroup(groupId);
    const membership = await this.groupRepository.findMembership(groupId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
    return membership.role;
  }

  private async resolveUserIdByEmail(email: string): Promise<string> {
    const user = await this.groupRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException(`No user found with email ${email}`);
    }
    return user.id;
  }
}
