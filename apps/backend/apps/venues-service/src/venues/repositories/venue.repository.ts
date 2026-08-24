import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { MyReservationDto, PublicVenueDto, ReservationDto, VenueDto } from '@ef/contracts';
import { GroupRole, ReservationStatus, VenueSurfaceType } from '@prisma/client';

@Injectable()
export class VenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOwner(ownerId: string): Promise<VenueDto[]> {
    return this.prisma.venue
      .findMany({
        where: { ownerId },
        orderBy: { name: 'asc' },
      })
      .then((rows) => rows.map((row) => this.toVenueDto(row)));
  }

  async upsertForOwner(
    ownerId: string,
    payload: {
      id?: string;
      name: string;
      address?: string | null;
      pricePerHourCents?: number;
      surfaceType?: VenueSurfaceType;
    },
  ): Promise<VenueDto> {
    if (payload.id) {
      const updated = await this.prisma.venue.update({
        where: { id: payload.id, ownerId },
        data: {
          name: payload.name,
          address: payload.address ?? null,
          pricePerHourCents: payload.pricePerHourCents ?? 0,
          surfaceType: payload.surfaceType,
        },
      });
      return this.toVenueDto(updated);
    }

    const created = await this.prisma.venue.create({
      data: {
        ownerId,
        name: payload.name,
        address: payload.address ?? null,
        pricePerHourCents: payload.pricePerHourCents ?? 0,
        surfaceType: payload.surfaceType,
      },
    });
    return this.toVenueDto(created);
  }

  /** Pool para la asignación aleatoria de cancha de Copa Elite Forge (Fase 7.2) — sin filtro extra de "activa", no existe ese concepto hoy. */
  listSyntheticGrassVenues(): Promise<{ id: string; name: string; ownerId: string }[]> {
    return this.prisma.venue.findMany({
      where: { surfaceType: 'synthetic_grass' },
      select: { id: true, name: true, ownerId: true },
    });
  }

  async listReservationsForOwner(ownerId: string): Promise<ReservationDto[]> {
    const venues = await this.prisma.venue.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const venueIds = venues.map((v) => v.id);
    if (venueIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.reservation.findMany({
      where: { venueId: { in: venueIds } },
      orderBy: { startsAt: 'desc' },
      take: 100,
    });

    return rows.map((row) => this.toReservationDto(row));
  }

  async updateReservationStatus(
    ownerId: string,
    reservationId: string,
    status: ReservationStatus,
  ): Promise<ReservationDto> {
    const venues = await this.prisma.venue.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const venueIds = venues.map((v) => v.id);
    if (venueIds.length === 0) {
      throw new NotFoundException('Reservation not found');
    }

    const result = await this.prisma.reservation.updateMany({
      where: {
        id: reservationId,
        venueId: { in: venueIds },
      },
      data: { status },
    });

    if (result.count === 0) {
      throw new NotFoundException('Reservation not found');
    }

    const updated = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: reservationId },
    });
    return this.toReservationDto(updated);
  }

  // --- Lado jugador (Fase 4) ---

  async listPublic(): Promise<PublicVenueDto[]> {
    const rows = await this.prisma.venue.findMany({ orderBy: { name: 'asc' } });
    return rows.map((row) => this.toPublicVenueDto(row));
  }

  async findVenueById(venueId: string): Promise<{ id: string; name: string } | null> {
    return this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true },
    });
  }

  async hasOverlappingReservation(
    venueId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<boolean> {
    const count = await this.prisma.reservation.count({
      where: {
        venueId,
        status: { in: ['pending', 'confirmed'] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    return count > 0;
  }

  /**
   * originGroupId/opponentGroupId de un match — vive conceptualmente en
   * users-service, pero comparte la misma base Postgres, así que se lee
   * directo en vez de cruzar el límite de la app (no hay alias de path
   * entre apps/, solo entre libs/; importar código de users-service
   * rompería el build independiente de venues-service).
   */
  async findMatchGroups(
    matchId: string,
  ): Promise<{ originGroupId: string; opponentGroupId: string | null } | null> {
    return this.prisma.match.findUnique({
      where: { id: matchId },
      select: { originGroupId: true, opponentGroupId: true },
    });
  }

  async findGroupMembershipRole(
    groupId: string,
    userId: string,
  ): Promise<GroupRole | null> {
    const membership = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });
    return membership?.role ?? null;
  }

  async hasReservationForMatch(matchId: string): Promise<boolean> {
    const existing = await this.prisma.reservation.findUnique({
      where: { matchId },
      select: { id: true },
    });
    return existing != null;
  }

  async createReservation(data: {
    userId: string;
    venueId: string;
    venueName: string;
    startsAt: Date;
    endsAt: Date;
    notes?: string;
    matchId?: string;
  }): Promise<MyReservationDto> {
    const created = await this.prisma.reservation.create({ data });
    return this.toMyReservationDto(created);
  }

  async findReservationById(reservationId: string): Promise<MyReservationDto | null> {
    const row = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    return row ? this.toMyReservationDto(row) : null;
  }

  async listMyReservations(userId: string): Promise<MyReservationDto[]> {
    const rows = await this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { startsAt: 'desc' },
    });
    return rows.map((row) => this.toMyReservationDto(row));
  }

  async cancelReservation(reservationId: string): Promise<MyReservationDto> {
    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'cancelled' },
    });
    return this.toMyReservationDto(updated);
  }

  private toPublicVenueDto(row: {
    id: string;
    name: string;
    address: string | null;
    pricePerHourCents: number;
    availability: unknown;
  }): PublicVenueDto {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      pricePerHourCents: row.pricePerHourCents,
      availability: (row.availability as Record<string, unknown>) ?? {},
    };
  }

  private toMyReservationDto(row: {
    id: string;
    userId: string;
    venueId: string | null;
    venueName: string;
    startsAt: Date;
    endsAt: Date;
    status: ReservationStatus;
    notes: string | null;
    matchId: string | null;
    createdAt: Date;
  }): MyReservationDto {
    return {
      id: row.id,
      userId: row.userId,
      venueId: row.venueId,
      venueName: row.venueName,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      status: row.status,
      notes: row.notes,
      matchId: row.matchId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVenueDto(row: {
    id: string;
    ownerId: string;
    name: string;
    address: string | null;
    pricePerHourCents: number;
    availability: unknown;
    surfaceType: VenueSurfaceType | null;
    createdAt: Date;
    updatedAt: Date;
  }): VenueDto {
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      address: row.address,
      pricePerHourCents: row.pricePerHourCents,
      availability: (row.availability as Record<string, unknown>) ?? {},
      surfaceType: row.surfaceType,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toReservationDto(row: {
    id: string;
    userId: string;
    venueId: string | null;
    venueName: string;
    startsAt: Date;
    endsAt: Date;
    status: ReservationStatus;
    notes: string | null;
    createdAt: Date;
  }): ReservationDto {
    return {
      id: row.id,
      userId: row.userId,
      venueId: row.venueId,
      venueName: row.venueName,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      status: row.status,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
