import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { GroupFriendshipDto, GroupFriendshipStatus } from '@ef/contracts';
import { Prisma } from '@prisma/client';

const withGroups = Prisma.validator<Prisma.GroupFriendshipDefaultArgs>()({
  include: { groupA: true, groupB: true },
});
type GroupFriendshipWithGroups = Prisma.GroupFriendshipGetPayload<typeof withGroups>;

function toDto(row: GroupFriendshipWithGroups): GroupFriendshipDto {
  return {
    id: row.id,
    groupAId: row.groupAId,
    groupAName: row.groupA.name,
    groupAPhotoBase64: row.groupA.photoBase64,
    groupBId: row.groupBId,
    groupBName: row.groupB.name,
    groupBPhotoBase64: row.groupB.photoBase64,
    status: row.status as GroupFriendshipStatus,
    requestedByGroupId: row.requestedByGroupId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class GroupFriendshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    groupAId: string,
    groupBId: string,
    requestedByGroupId: string,
  ): Promise<GroupFriendshipDto> {
    const row = await this.prisma.groupFriendship.create({
      data: { groupAId, groupBId, requestedByGroupId },
      include: { groupA: true, groupB: true },
    });
    return toDto(row);
  }

  async findById(friendshipId: string): Promise<GroupFriendshipDto | null> {
    const row = await this.prisma.groupFriendship.findUnique({
      where: { id: friendshipId },
      include: { groupA: true, groupB: true },
    });
    return row ? toDto(row) : null;
  }

  async findByPair(
    groupAId: string,
    groupBId: string,
  ): Promise<GroupFriendshipDto | null> {
    const row = await this.prisma.groupFriendship.findUnique({
      where: { groupAId_groupBId: { groupAId, groupBId } },
      include: { groupA: true, groupB: true },
    });
    return row ? toDto(row) : null;
  }

  async accept(friendshipId: string): Promise<GroupFriendshipDto> {
    const row = await this.prisma.groupFriendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
      include: { groupA: true, groupB: true },
    });
    return toDto(row);
  }

  async remove(friendshipId: string): Promise<void> {
    await this.prisma.groupFriendship.delete({ where: { id: friendshipId } });
  }

  async listForGroup(groupId: string): Promise<GroupFriendshipDto[]> {
    const rows = await this.prisma.groupFriendship.findMany({
      where: { OR: [{ groupAId: groupId }, { groupBId: groupId }] },
      include: { groupA: true, groupB: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  }

  async existsAccepted(groupAId: string, groupBId: string): Promise<boolean> {
    const row = await this.prisma.groupFriendship.findUnique({
      where: { groupAId_groupBId: { groupAId, groupBId } },
      select: { status: true },
    });
    return row?.status === 'accepted';
  }
}
