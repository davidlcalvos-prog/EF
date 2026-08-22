import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  MatchDto,
  MatchParticipantDto,
  MatchSide,
  MatchStatus,
  MatchSummaryDto,
  MatchTeam,
  MatchType,
} from '@ef/contracts';
import {
  MatchSide as PrismaMatchSide,
  MatchStatus as PrismaMatchStatus,
  MatchTeam as PrismaMatchTeam,
  MatchType as PrismaMatchType,
} from '@prisma/client';
import type { RandomizerPlayer } from '../team-randomizer';

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
          // El creador de un vs arranca del lado origin — es líder de ese
          // grupo por construcción (validado en el service antes de llegar acá).
          create: { userId: data.createdBy, side: data.type === 'vs' ? 'origin' : undefined },
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
      team: (p.team as MatchTeam | null) ?? null,
      side: (p.side as MatchSide | null) ?? null,
    }));

    const originSideCount = participants.filter((p) => p.side === 'origin').length;
    const opponentSideCount = participants.filter((p) => p.side === 'opponent').length;

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
      teamsRandomizedAt: match.teamsRandomizedAt?.toISOString() ?? null,
      rosterConfirmedAt: match.rosterConfirmedAt?.toISOString() ?? null,
      originSideCount,
      opponentSideCount,
      sideCapacity: match.maxPlayers / 2,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
    };
  }

  async countParticipantsBySide(matchId: string, side: MatchSide): Promise<number> {
    return this.prisma.matchParticipant.count({
      where: { matchId, side: side as PrismaMatchSide },
    });
  }

  /**
   * Todo en una transacción: agrega al participante del lado indicado y, si
   * con esta incorporación ambos lados llegan a sideCapacity por primera vez,
   * confirma el roster. El guard `rosterConfirmedAt: null` en el update hace
   * que la confirmación sea idempotente (nunca se pisa una ya existente).
   */
  async addVsParticipant(
    matchId: string,
    userId: string,
    side: MatchSide,
    sideCapacity: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.matchParticipant.create({
        data: { matchId, userId, side: side as PrismaMatchSide },
      });

      const [originCount, opponentCount] = await Promise.all([
        tx.matchParticipant.count({ where: { matchId, side: 'origin' } }),
        tx.matchParticipant.count({ where: { matchId, side: 'opponent' } }),
      ]);

      if (originCount >= sideCapacity && opponentCount >= sideCapacity) {
        await tx.match.updateMany({
          where: { id: matchId, rosterConfirmedAt: null },
          data: { rosterConfirmedAt: new Date() },
        });
      }
    });
  }

  /** Un solo query batched (sin N+1) con favoritePosition + las 6 stats de cada participante. */
  async findParticipantsForRandomization(matchId: string): Promise<RandomizerPlayer[]> {
    const rows = await this.prisma.matchParticipant.findMany({
      where: { matchId },
      select: {
        userId: true,
        user: {
          select: {
            profile: { select: { favoritePosition: true } },
            playerStats: {
              select: {
                attack: true,
                defense: true,
                endurance: true,
                speed: true,
                passes: true,
                dribbling: true,
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      userId: row.userId,
      favoritePosition: row.user.profile?.favoritePosition ?? null,
      stats: {
        attack: row.user.playerStats?.attack ?? 0,
        defense: row.user.playerStats?.defense ?? 0,
        endurance: row.user.playerStats?.endurance ?? 0,
        speed: row.user.playerStats?.speed ?? 0,
        passes: row.user.playerStats?.passes ?? 0,
        dribbling: row.user.playerStats?.dribbling ?? 0,
      },
    }));
  }

  /** Todo o nada: pisa el reparto anterior (si lo había) y actualiza el timestamp del sorteo. */
  async persistTeamAssignments(
    matchId: string,
    assignments: Map<string, MatchTeam>,
  ): Promise<void> {
    await this.prisma.$transaction([
      ...Array.from(assignments.entries()).map(([userId, team]) =>
        this.prisma.matchParticipant.update({
          where: { matchId_userId: { matchId, userId } },
          data: { team: team as PrismaMatchTeam },
        }),
      ),
      this.prisma.match.update({
        where: { id: matchId },
        data: { teamsRandomizedAt: new Date() },
      }),
    ]);
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
