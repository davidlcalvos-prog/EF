import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  GroupDetailDto,
  GroupMemberDto,
  GroupMemberRole,
  GroupSearchResultDto,
  GroupSummaryDto,
} from '@ef/contracts';
import { GroupRole } from '@prisma/client';

interface MembershipRow {
  role: GroupRole;
}

@Injectable()
export class GroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(creatorId: string, name: string): Promise<GroupDetailDto> {
    const group = await this.prisma.group.create({
      data: {
        name,
        creatorId,
        members: {
          create: { userId: creatorId, role: 'creator' },
        },
      },
    });
    return this.findDetail(group.id) as Promise<GroupDetailDto>;
  }

  async findMembership(
    groupId: string,
    userId: string,
  ): Promise<MembershipRow | null> {
    return this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });
  }

  /** true si ambos usuarios comparten al menos un grupo (cualquier rol). */
  async shareAnyGroup(userIdA: string, userIdB: string): Promise<boolean> {
    const membership = await this.prisma.groupMembership.findFirst({
      where: {
        userId: userIdA,
        group: { members: { some: { userId: userIdB } } },
      },
      select: { id: true },
    });
    return !!membership;
  }

  async findGroupById(
    groupId: string,
  ): Promise<{ id: string; name: string; creatorId: string } | null> {
    return this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, creatorId: true },
    });
  }

  async update(
    groupId: string,
    data: { name: string; photoBase64?: string | null },
  ): Promise<void> {
    await this.prisma.group.update({
      where: { id: groupId },
      data,
    });
  }

  async findUserByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  async countAdmins(groupId: string): Promise<number> {
    return this.prisma.groupMembership.count({
      where: { groupId, role: 'admin' },
    });
  }

  async addMembership(
    groupId: string,
    userId: string,
    role: GroupRole = 'member',
  ): Promise<void> {
    await this.prisma.groupMembership.create({
      data: { groupId, userId, role },
    });
  }

  async updateMembershipRole(
    groupId: string,
    userId: string,
    role: GroupRole,
  ): Promise<void> {
    await this.prisma.groupMembership.update({
      where: { groupId_userId: { groupId, userId } },
      data: { role },
    });
  }

  async removeMembership(groupId: string, userId: string): Promise<void> {
    await this.prisma.groupMembership.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.prisma.group.delete({ where: { id: groupId } });
  }

  async listForUser(userId: string): Promise<GroupSummaryDto[]> {
    const memberships = await this.prisma.groupMembership.findMany({
      where: { userId },
      include: {
        group: {
          include: { _count: { select: { members: true } } },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((membership) => ({
      id: membership.group.id,
      name: membership.group.name,
      photoBase64: membership.group.photoBase64,
      creatorId: membership.group.creatorId,
      role: membership.role as GroupMemberRole,
      memberCount: membership.group._count.members,
      createdAt: membership.group.createdAt.toISOString(),
    }));
  }

  async searchByName(query: string): Promise<GroupSearchResultDto[]> {
    const groups = await this.prisma.group.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      include: { _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      photoBase64: group.photoBase64,
      memberCount: group._count.members,
    }));
  }

  async findDetail(groupId: string): Promise<GroupDetailDto | null> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { email: true, firstname: true, lastname: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!group) return null;

    const members: GroupMemberDto[] = group.members.map((membership) => ({
      userId: membership.userId,
      email: membership.user.email,
      name: [membership.user.firstname, membership.user.lastname]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' '),
      role: membership.role as GroupMemberRole,
      joinedAt: membership.joinedAt.toISOString(),
    }));

    return {
      id: group.id,
      name: group.name,
      photoBase64: group.photoBase64,
      creatorId: group.creatorId,
      members,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }
}
