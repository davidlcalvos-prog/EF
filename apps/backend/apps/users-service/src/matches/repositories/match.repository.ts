import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { MatchDto, MatchParticipantDto, MatchStatus, MatchSummaryDto, MatchType } from '@ef/contracts';
import { MatchStatus as PrismaMatchStatus, MatchType as PrismaMatchType } from '@prisma/client';

@Injectable()
export class MatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    originGroupId: string;
    opponentGroupId?: string;
    type: PrismaMatchType;
    format: string;
    maxPlayers: number;
    status: PrismaMatchStatus;
    scheduledAt?: Date;
    createdBy: string;
  }): Promise<MatchDto> {
    const match = await this.prisma.match.create({
      data: {
        ...data,
        participants: {
          create: { userId: data.createdBy },
        },
      },
    });
    return this.findDetail(match.id) as Promise<MatchDto>;
  }

  async findCore(matchId: string): Promise<{
    id: string;
    originGroupId: string;
    opponentGroupId: string | null;
    type: MatchType;
    status: MatchStatus;
    maxPlayers: number;
    createdBy: string;
  } | null> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        originGroupId: true,
        opponentGroupId: true,
        type: true,
        status: true,
        maxPlayers: true,
        createdBy: true,
      },
    });
    if (!match) return null;
    return {
      ...match,
      type: match.type as MatchType,
      status: match.status as MatchStatus,
    };
  }

  async isParticipant(matchId: string, userId: string): Promise<boolean> {
    const row = await this.prisma.matchParticipant.findUnique({
      where: { matchId_userId: { matchId, userId } },
      select: { userId: true },
    });
    return row != null;
  }

  async countParticipants(matchId: string): Promise<number> {
    return this.prisma.matchParticipant.count({ where: { matchId } });
  }

  async addParticipant(matchId: string, userId: string): Promise<void> {
    await this.prisma.matchParticipant.create({ data: { matchId, userId } });
  }

  async removeParticipant(matchId: string, userId: string): Promise<void> {
    await this.prisma.matchParticipant.delete({
      where: { matchId_userId: { matchId, userId } },
    });
  }

  async updateStatus(matchId: string, status: PrismaMatchStatus): Promise<void> {
    await this.prisma.match.update({ where: { id: matchId }, data: { status } });
  }

  async listMineForUser(
    userId: string,
    groupIds: string[],
  ): Promise<MatchSummaryDto[]> {
    const rows = await this.prisma.match.findMany({
      where: {
        OR: [
          { participants: { some: { userId } } },
          { originGroupId: { in: groupIds } },
          { opponentGroupId: { in: groupIds } },
        ],
      },
      include: { _count: { select: { participants: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toSummaryDto(row));
  }

  async listByGroup(groupId: string): Promise<MatchSummaryDto[]> {
    const rows = await this.prisma.match.findMany({
      where: { OR: [{ originGroupId: groupId }, { opponentGroupId: groupId }] },
      include: { _count: { select: { participants: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toSummaryDto(row));
  }

  async findDetail(matchId: string): Promise<MatchDto | null> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        originGroup: { select: { name: true } },
        opponentGroup: { select: { name: true } },
        reservation: { select: { id: true } },
        participants: {
          include: {
            user: { select: { email: true, firstname: true, lastname: true } },
          },
          orderBy: { confirmedAt: 'asc' },
        },
      },
    });
    if (!match) return null;

    const participants: MatchParticipantDto[] = match.participants.map((p) => ({
      userId: p.userId,
      email: p.user.email,
      name: [p.user.firstname, p.user.lastname]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' '),
      confirmedAt: p.confirmedAt.toISOString(),
    }));

    return {
      id: match.id,
      originGroupId: match.originGroupId,
      originGroupName: match.originGroup.name,
      opponentGroupId: match.opponentGroupId,
      opponentGroupName: match.opponentGroup?.name ?? null,
      type: match.type as MatchType,
      format: match.format,
      maxPlayers: match.maxPlayers,
      status: match.status as MatchStatus,
      scheduledAt: match.scheduledAt?.toISOString() ?? null,
      createdBy: match.createdBy,
      reservationId: match.reservation?.id ?? null,
      participants,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
    };
  }

  private toSummaryDto(row: {
    id: string;
    originGroupId: string;
    opponentGroupId: string | null;
    type: string;
    format: string;
    maxPlayers: number;
    status: string;
    scheduledAt: Date | null;
    createdAt: Date;
    _count: { participants: number };
  }): MatchSummaryDto {
    return {
      id: row.id,
      originGroupId: row.originGroupId,
      opponentGroupId: row.opponentGroupId,
      type: row.type as MatchType,
      format: row.format,
      maxPlayers: row.maxPlayers,
      status: row.status as MatchStatus,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      participantCount: row._count.participants,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
