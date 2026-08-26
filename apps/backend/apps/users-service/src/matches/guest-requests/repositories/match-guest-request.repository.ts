import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { distanceKmExpr } from '@ef/database';
import { Prisma } from '@prisma/client';
import {
  MatchGuestApplicationDto,
  MatchGuestApplicationStatus,
  MatchGuestRequestDto,
  MatchGuestRequestStatus,
  PlayerPositionId,
} from '@ef/contracts';
import {
  toUserSummary,
  UserWithProfile,
} from '../../../user-friendships/repositories/user-friendship.repository';
import { assertRosterHasCapacity, lockMatchRow } from '../../repositories/match.repository';

const requestWithMatch = Prisma.validator<Prisma.MatchGuestRequestDefaultArgs>()({
  include: {
    match: {
      include: {
        originGroup: { select: { name: true, city: true } },
        venue: { select: { name: true, city: true } },
      },
    },
  },
});
type RequestWithMatch = Prisma.MatchGuestRequestGetPayload<typeof requestWithMatch>;

const applicationWithUser = Prisma.validator<Prisma.MatchGuestApplicationDefaultArgs>()({
  include: { user: { include: { profile: true } } },
});
type ApplicationWithUser = Prisma.MatchGuestApplicationGetPayload<typeof applicationWithUser>;

interface NearbyRow {
  id: string;
  matchId: string;
  requestedPosition: string | null;
  radiusKm: number;
  status: string;
  expiresAt: Date;
  originGroupName: string;
  venueName: string | null;
  city: string | null;
  scheduledAt: Date | null;
  format: string;
  distanceKm: number;
  applicationsCount: number;
  myApplicationStatus: string | null;
}

function toRequestDto(
  row: RequestWithMatch,
  applicationsCount: number,
  myApplicationStatus: 'none' | MatchGuestApplicationStatus,
): MatchGuestRequestDto {
  return {
    id: row.id,
    matchId: row.matchId,
    requestedPosition: row.requestedPosition as PlayerPositionId | null,
    radiusKm: row.radiusKm,
    status: row.status as MatchGuestRequestStatus,
    expiresAt: row.expiresAt.toISOString(),
    match: {
      originGroupName: row.match.originGroup.name,
      venueName: row.match.venue?.name ?? null,
      city: row.match.venue?.city ?? row.match.originGroup.city ?? null,
      scheduledAt: row.match.scheduledAt?.toISOString() ?? null,
      format: row.match.format,
    },
    applicationsCount,
    myApplicationStatus,
  };
}

@Injectable()
export class MatchGuestRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Solicitudes ──────────────────────────────────────────────────────

  async findOpenForMatch(matchId: string): Promise<{ id: string } | null> {
    return this.prisma.matchGuestRequest.findFirst({
      where: { matchId, status: 'open' },
      select: { id: true },
    });
  }

  async create(data: {
    matchId: string;
    requestedBy: string;
    requestedPosition: string | null;
    radiusKm: number;
    expiresAt: Date;
  }): Promise<RequestWithMatch> {
    return this.prisma.matchGuestRequest.create({ data, ...requestWithMatch });
  }

  /** La más reciente para el partido, sin importar su estado ("current"). */
  async findLatestForMatch(matchId: string): Promise<RequestWithMatch | null> {
    return this.prisma.matchGuestRequest.findFirst({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
      ...requestWithMatch,
    });
  }

  async findById(requestId: string): Promise<RequestWithMatch | null> {
    return this.prisma.matchGuestRequest.findUnique({
      where: { id: requestId },
      ...requestWithMatch,
    });
  }

  async countApplications(requestId: string): Promise<number> {
    return this.prisma.matchGuestApplication.count({ where: { requestId } });
  }

  async findMyApplicationStatus(
    requestId: string,
    userId: string,
  ): Promise<MatchGuestApplicationStatus | null> {
    const row = await this.prisma.matchGuestApplication.findUnique({
      where: { requestId_userId: { requestId, userId } },
      select: { status: true },
    });
    return (row?.status as MatchGuestApplicationStatus) ?? null;
  }

  async cancel(requestId: string): Promise<void> {
    await this.prisma.matchGuestRequest.update({
      where: { id: requestId },
      data: { status: 'cancelled' },
    });
  }

  /**
   * Lazy cleanup (Fase 11, sin cron): se llama al principio de listNearby y
   * getForMatch. A este volumen alcanza — ver vs-match-alerts.service.ts para
   * el patrón de cron si algún día hiciera falta uno.
   */
  async expireStale(): Promise<void> {
    await this.prisma.matchGuestRequest.updateMany({
      where: { status: 'open', expiresAt: { lt: new Date() } },
      data: { status: 'expired' },
    });
  }

  // ── Postulaciones ────────────────────────────────────────────────────

  async findApplicationById(applicationId: string): Promise<ApplicationWithUser | null> {
    return this.prisma.matchGuestApplication.findUnique({
      where: { id: applicationId },
      ...applicationWithUser,
    });
  }

  async findApplicationForUser(
    requestId: string,
    userId: string,
  ): Promise<{ id: string; status: MatchGuestApplicationStatus } | null> {
    const row = await this.prisma.matchGuestApplication.findUnique({
      where: { requestId_userId: { requestId, userId } },
      select: { id: true, status: true },
    });
    return row ? { id: row.id, status: row.status as MatchGuestApplicationStatus } : null;
  }

  async createApplication(requestId: string, userId: string): Promise<void> {
    await this.prisma.matchGuestApplication.create({ data: { requestId, userId } });
  }

  async withdrawApplication(applicationId: string): Promise<void> {
    await this.prisma.matchGuestApplication.update({
      where: { id: applicationId },
      data: { status: 'withdrawn' },
    });
  }

  async rejectApplication(applicationId: string): Promise<void> {
    await this.prisma.matchGuestApplication.update({
      where: { id: applicationId },
      data: { status: 'rejected' },
    });
  }

  async listApplications(requestId: string): Promise<MatchGuestApplicationDto[]> {
    const rows = await this.prisma.matchGuestApplication.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
      ...applicationWithUser,
    });
    return rows.map((row) => this.toApplicationDto(row));
  }

  /**
   * Postulaciones `pending` de la request, salvo `exceptApplicationId` —
   * usado al aceptar (rechaza el resto) y al cancelar (rechaza todas, sin
   * excepción). Devuelve los userId para poder avisarles por push.
   */
  async rejectOtherPendingApplications(
    requestId: string,
    exceptApplicationId: string | null,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<string[]> {
    const pending = await tx.matchGuestApplication.findMany({
      where: {
        requestId,
        status: 'pending',
        ...(exceptApplicationId ? { id: { not: exceptApplicationId } } : {}),
      },
      select: { id: true, userId: true },
    });
    if (pending.length > 0) {
      await tx.matchGuestApplication.updateMany({
        where: { id: { in: pending.map((p) => p.id) } },
        data: { status: 'rejected' },
      });
    }
    return pending.map((p) => p.userId);
  }

  /**
   * Acepta una postulación dentro de la MISMA transacción y lock de Fase 8.2
   * (`lockMatchRow`/`assertRosterHasCapacity`, reutilizados tal cual — no
   * reescritos). El lock sobre `matches` serializa dos accept() concurrentes
   * de solicitudes del mismo partido: el segundo, ya con el lock tomado,
   * relee el estado fresco de la request/application y aborta si el primero
   * ya las cambió, en vez de confiar en lo que leyó antes de esperar el lock.
   */
  async acceptApplication(params: {
    applicationId: string;
    requestId: string;
    matchId: string;
    userId: string;
    maxPlayers: number;
  }): Promise<string[]> {
    const { applicationId, requestId, matchId, userId, maxPlayers } = params;
    return this.prisma.$transaction(async (tx) => {
      await lockMatchRow(tx, matchId);

      const [freshRequest, freshApplication] = await Promise.all([
        tx.matchGuestRequest.findUniqueOrThrow({
          where: { id: requestId },
          select: { status: true },
        }),
        tx.matchGuestApplication.findUniqueOrThrow({
          where: { id: applicationId },
          select: { status: true },
        }),
      ]);
      if (freshRequest.status !== 'open') {
        throw new ConflictException('This guest request is no longer open');
      }
      if (freshApplication.status !== 'pending') {
        throw new ConflictException('This application is no longer pending');
      }

      await assertRosterHasCapacity(tx, matchId, maxPlayers);
      await tx.matchParticipant.create({ data: { matchId, userId, isGuest: true } });
      await tx.matchGuestApplication.update({
        where: { id: applicationId },
        data: { status: 'accepted' },
      });
      await tx.matchGuestRequest.update({ where: { id: requestId }, data: { status: 'filled' } });

      return this.rejectOtherPendingApplications(requestId, applicationId, tx);
    });
  }

  // ── Push: candidatos dentro del radio ────────────────────────────────

  /**
   * userId de perfiles activos con `notifyNearbyGuestRequests`, dentro del
   * radio del partido, que no sean ya miembros del originGroup, y — si se
   * pidió una posición — que jueguen ahí o no tengan preferencia. Todo el
   * filtro se resuelve en SQL (no se trae todo a memoria).
   */
  async findNotifyCandidates(params: {
    matchLat: number;
    matchLng: number;
    radiusKm: number;
    originGroupId: string;
    requestedPosition: string | null;
  }): Promise<string[]> {
    const { matchLat, matchLng, radiusKm, originGroupId, requestedPosition } = params;
    const positionFilter = requestedPosition
      ? Prisma.sql`AND (p."favoritePosition" IS NULL OR p."favoritePosition" = ${requestedPosition})`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<{ userId: string }[]>(Prisma.sql`
      SELECT p."userId" AS "userId"
      FROM profiles p
      JOIN users u ON u.id = p."userId"
      WHERE p."notifyNearbyGuestRequests" = true
        AND u.estado = true
        AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        AND ${distanceKmExpr(matchLat, matchLng, 'p.')} <= ${radiusKm}
        AND NOT EXISTS (
          SELECT 1 FROM group_memberships gm
          WHERE gm."groupId" = ${originGroupId}::uuid AND gm."userId" = p."userId"
        )
        ${positionFilter}
    `);
    return rows.map((r) => r.userId);
  }

  // ── Listado "cerca de mí" ────────────────────────────────────────────

  /**
   * Solicitudes `open` no vencidas dentro del radio DE CADA SOLICITUD
   * (columna, no constante — por eso no alcanza con `whereWithinKm`),
   * excluyendo partidos de grupos donde el usuario ya es miembro, con
   * distancia y el estado de su propia postulación si tiene una.
   */
  async listNearby(userId: string, userLat: number, userLng: number): Promise<MatchGuestRequestDto[]> {
    const rows = await this.prisma.$queryRaw<NearbyRow[]>(Prisma.sql`
      SELECT
        mgr.id AS "id",
        mgr."matchId" AS "matchId",
        mgr."requestedPosition" AS "requestedPosition",
        mgr."radiusKm" AS "radiusKm",
        mgr.status AS "status",
        mgr."expiresAt" AS "expiresAt",
        g.name AS "originGroupName",
        v.name AS "venueName",
        COALESCE(v.city, g.city) AS "city",
        m."scheduledAt" AS "scheduledAt",
        m.format AS "format",
        ${distanceKmExpr(userLat, userLng, 'm.')} AS "distanceKm",
        CAST(
          (SELECT COUNT(*) FROM match_guest_applications a WHERE a."requestId" = mgr.id)
          AS INTEGER
        ) AS "applicationsCount",
        (
          SELECT a2.status FROM match_guest_applications a2
          WHERE a2."requestId" = mgr.id AND a2."userId" = ${userId}::uuid
        ) AS "myApplicationStatus"
      FROM match_guest_requests mgr
      JOIN matches m ON m.id = mgr."matchId"
      JOIN groups g ON g.id = m."originGroupId"
      LEFT JOIN venues v ON v.id = m."venueId"
      WHERE mgr.status = 'open'
        AND mgr."expiresAt" > now()
        AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
        AND ${distanceKmExpr(userLat, userLng, 'm.')} <= mgr."radiusKm"
        AND NOT EXISTS (
          SELECT 1 FROM group_memberships gm
          WHERE gm."groupId" = m."originGroupId" AND gm."userId" = ${userId}::uuid
        )
      ORDER BY "distanceKm" ASC
    `);

    return rows.map((row) => ({
      id: row.id,
      matchId: row.matchId,
      requestedPosition: row.requestedPosition as PlayerPositionId | null,
      radiusKm: row.radiusKm,
      status: row.status as MatchGuestRequestStatus,
      expiresAt: row.expiresAt.toISOString(),
      match: {
        originGroupName: row.originGroupName,
        venueName: row.venueName,
        city: row.city,
        scheduledAt: row.scheduledAt?.toISOString() ?? null,
        format: row.format,
      },
      applicationsCount: row.applicationsCount,
      myApplicationStatus: (row.myApplicationStatus as MatchGuestApplicationStatus | null) ?? 'none',
      distanceKm: Math.round(row.distanceKm * 10) / 10,
    }));
  }

  // ── Mapeo a DTO ──────────────────────────────────────────────────────

  toDto(
    row: RequestWithMatch,
    applicationsCount: number,
    myApplicationStatus: 'none' | MatchGuestApplicationStatus,
  ): MatchGuestRequestDto {
    return toRequestDto(row, applicationsCount, myApplicationStatus);
  }

  private toApplicationDto(row: ApplicationWithUser): MatchGuestApplicationDto {
    return {
      id: row.id,
      status: row.status as MatchGuestApplicationStatus,
      user: toUserSummary(row.user as UserWithProfile),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
