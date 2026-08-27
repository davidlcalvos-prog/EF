import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import {
  CourtDto,
  MyReservationDto,
  PublicVenueDto,
  ReservationDto,
  VenueDto,
} from '@ef/contracts';
import {
  CourtSize,
  GroupRole,
  LocationSource,
  Prisma,
  ReservationSource,
  ReservationStatus,
  VenueSurfaceType,
} from '@prisma/client';

/** Ubicación resuelta por VenuesService (Fase L.0). */
export interface VenueLocationData {
  municipalityCode: string;
  city: string;
  department: string;
  latitude: number;
  longitude: number;
  locationSource: 'municipality' | 'pin';
}

type CourtRow = {
  id: string;
  name: string;
  size: CourtSize;
  surfaceType: VenueSurfaceType | null;
  pricePerHourCents: number;
  isActive: boolean;
};

const venueWithCourts = Prisma.validator<Prisma.VenueDefaultArgs>()({
  include: { courts: { orderBy: { name: 'asc' } } },
});
type VenueWithCourts = Prisma.VenueGetPayload<typeof venueWithCourts>;

@Injectable()
export class VenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOwner(ownerId: string): Promise<VenueDto[]> {
    return this.prisma.venue
      .findMany({
        where: { ownerId },
        ...venueWithCourts,
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
    location?: VenueLocationData | null,
  ): Promise<VenueDto> {
    const locationData =
      location === undefined
        ? {}
        : location
          ? { ...location, locationUpdatedAt: new Date() }
          : {
              municipalityCode: null,
              city: null,
              department: null,
              latitude: null,
              longitude: null,
              locationSource: null,
              locationUpdatedAt: new Date(),
            };

    if (payload.id) {
      const updated = await this.prisma.venue.update({
        where: { id: payload.id, ownerId },
        data: {
          name: payload.name,
          address: payload.address ?? null,
          pricePerHourCents: payload.pricePerHourCents ?? 0,
          surfaceType: payload.surfaceType,
          ...locationData,
        },
        ...venueWithCourts,
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
        ...locationData,
      },
      ...venueWithCourts,
    });
    return this.toVenueDto(created);
  }

  /** Pool para la asignación aleatoria de cancha de Copa Elite Forge (Fase 7.2) — sin filtro extra de "activa", no existe ese concepto hoy. */
  listSyntheticGrassVenues(
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<{ id: string; name: string; ownerId: string }[]> {
    return client.venue.findMany({
      where: { surfaceType: 'synthetic_grass' },
      select: { id: true, name: true, ownerId: true },
    });
  }

  // --- Courts (Fase W.1) ---

  /** Confirma que el venue exista y sea del owner — 404 si no, para no filtrar si existe pero es de otro. */
  private async requireOwnedVenue(ownerId: string, venueId: string): Promise<void> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { ownerId: true },
    });
    if (!venue || venue.ownerId !== ownerId) {
      throw new NotFoundException(`Venue ${venueId} not found`);
    }
  }

  /** Court + su venue, para validar dueño sin dos idas a la base. */
  private async findCourtWithVenue(courtId: string) {
    return this.prisma.court.findUnique({
      where: { id: courtId },
      include: { venue: { select: { id: true, ownerId: true, name: true } } },
    });
  }

  private async requireOwnedCourt(ownerId: string, courtId: string) {
    const court = await this.findCourtWithVenue(courtId);
    if (!court || court.venue.ownerId !== ownerId) {
      throw new NotFoundException(`Court ${courtId} not found`);
    }
    return court;
  }

  async createCourt(
    ownerId: string,
    venueId: string,
    data: {
      name: string;
      size: CourtSize;
      surfaceType?: VenueSurfaceType;
      pricePerHourCents: number;
      isActive?: boolean;
    },
  ): Promise<CourtDto> {
    await this.requireOwnedVenue(ownerId, venueId);
    const created = await this.prisma.court.create({
      data: { venueId, ...data },
    });
    return this.toCourtDto(created);
  }

  async updateCourt(
    ownerId: string,
    courtId: string,
    data: {
      name?: string;
      size?: CourtSize;
      surfaceType?: VenueSurfaceType;
      pricePerHourCents?: number;
      isActive?: boolean;
    },
  ): Promise<CourtDto> {
    await this.requireOwnedCourt(ownerId, courtId);
    const updated = await this.prisma.court.update({
      where: { id: courtId },
      data,
    });
    return this.toCourtDto(updated);
  }

  /**
   * DELETE del lado dueño = desactivar, nunca borrar la fila (ver A.3): así
   * las reservas ya hechas no pierden a qué cancha pertenecían. Bloqueada
   * (409) si la cancha todavía tiene reservas futuras pending/confirmed —
   * apagarla ahí generaría una reserva "fantasma" sin cancha activa detrás.
   */
  async deactivateCourt(ownerId: string, courtId: string): Promise<CourtDto> {
    await this.requireOwnedCourt(ownerId, courtId);

    const futureCount = await this.prisma.reservation.count({
      where: {
        courtId,
        status: { in: ['pending', 'confirmed'] },
        startsAt: { gt: new Date() },
      },
    });
    if (futureCount > 0) {
      throw new ConflictException(
        'This court has upcoming reservations — cancel or wait for them before deactivating it',
      );
    }

    const updated = await this.prisma.court.update({
      where: { id: courtId },
      data: { isActive: false },
    });
    return this.toCourtDto(updated);
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
      include: {
        court: { select: { name: true } },
        user: { select: { firstname: true, lastname: true } },
      },
      orderBy: { startsAt: 'desc' },
      take: 100,
    });

    return rows.map((row) => this.toReservationDto(row));
  }

  /** ReservationDto ya trae userId/source — el service decide a quién mandar push con eso, sin una segunda consulta. */
  async updateReservationStatus(
    ownerId: string,
    reservationId: string,
    status: 'confirmed' | 'cancelled',
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
      include: {
        court: { select: { name: true } },
        user: { select: { firstname: true, lastname: true } },
      },
    });
    return this.toReservationDto(updated);
  }

  /** Reserva telefónica (Fase W.1) — nace confirmed, source=phone; el dueño la carga por su propia cancha. */
  async createPhoneReservation(data: {
    ownerId: string;
    courtId: string;
    startsAt: Date;
    endsAt: Date;
    customerName: string;
    customerPhone?: string;
    notes?: string;
  }): Promise<ReservationDto> {
    const court = await this.requireOwnedCourt(data.ownerId, data.courtId);
    if (!court.isActive) {
      throw new ConflictException('This court is not active');
    }

    const overlaps = await this.hasOverlappingReservationForCourt(
      data.courtId,
      data.startsAt,
      data.endsAt,
    );
    if (overlaps) {
      throw new ConflictException('This court already has a reservation in that time range');
    }

    const created = await this.prisma.reservation.create({
      data: {
        userId: data.ownerId,
        venueId: court.venueId,
        venueName: court.venue.name,
        courtId: data.courtId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        notes: data.notes,
        status: 'confirmed',
        source: 'phone',
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      },
      include: {
        court: { select: { name: true } },
        user: { select: { firstname: true, lastname: true } },
      },
    });
    return this.toReservationDto(created);
  }

  // --- Lado jugador (Fase 4) ---

  async listPublic(municipalityCode?: string): Promise<PublicVenueDto[]> {
    const rows = await this.prisma.venue.findMany({
      where: municipalityCode ? { municipalityCode } : undefined,
      ...venueWithCourts,
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toPublicVenueDto(row));
  }

  async findVenueById(venueId: string): Promise<{ id: string; name: string } | null> {
    return this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true },
    });
  }

  /** Fase W.1: solape a nivel de cancha — dos courts del mismo venue pueden reservarse a la misma hora. */
  async findActiveCourtWithVenue(courtId: string) {
    return this.prisma.court.findUnique({
      where: { id: courtId },
      include: { venue: { select: { id: true, name: true, ownerId: true } } },
    });
  }

  async hasOverlappingReservationForCourt(
    courtId: string,
    startsAt: Date,
    endsAt: Date,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const count = await client.reservation.count({
      where: {
        courtId,
        status: { in: ['pending', 'confirmed'] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    return count > 0;
  }

  /**
   * Solape a nivel de VENUE completo — se mantiene sin cambios para los
   * flujos automáticos de Match/Tournament (tournament.repository.ts
   * `hasOverlap`), que siguen asignando un venue entero, no una court
   * puntual (ver A.3 del prompt de Fase W.1: no tocar esa lógica).
   */
  async hasOverlappingReservation(
    venueId: string,
    startsAt: Date,
    endsAt: Date,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const count = await client.reservation.count({
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
    courtId: string;
    startsAt: Date;
    endsAt: Date;
    notes?: string;
    matchId?: string;
  }): Promise<MyReservationDto> {
    const created = await this.prisma.reservation.create({
      data,
      include: { court: { select: { name: true } } },
    });
    return this.toMyReservationDto(created);
  }

  async findReservationById(reservationId: string): Promise<MyReservationDto | null> {
    const row = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { court: { select: { name: true } } },
    });
    return row ? this.toMyReservationDto(row) : null;
  }

  async listMyReservations(userId: string): Promise<MyReservationDto[]> {
    const rows = await this.prisma.reservation.findMany({
      where: { userId },
      include: { court: { select: { name: true } } },
      orderBy: { startsAt: 'desc' },
    });
    return rows.map((row) => this.toMyReservationDto(row));
  }

  async cancelReservation(reservationId: string): Promise<MyReservationDto> {
    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'cancelled' },
      include: { court: { select: { name: true } } },
    });
    return this.toMyReservationDto(updated);
  }

  private toCourtDto(row: {
    id: string;
    name: string;
    size: CourtSize;
    surfaceType: VenueSurfaceType | null;
    pricePerHourCents: number;
    isActive: boolean;
  }): CourtDto {
    return {
      id: row.id,
      name: row.name,
      size: row.size,
      surfaceType: row.surfaceType,
      pricePerHourCents: row.pricePerHourCents,
      isActive: row.isActive,
    };
  }

  /** "Precio desde": mínimo entre las courts activas. Sin courts activas, el valor viejo del venue tal cual — ver A.3. */
  private minActiveCourtPrice(courts: CourtRow[], fallback: number): number {
    const activePrices = courts.filter((c) => c.isActive).map((c) => c.pricePerHourCents);
    return activePrices.length > 0 ? Math.min(...activePrices) : fallback;
  }

  private toPublicVenueDto(
    row: VenueWithCourts & {
      address: string | null;
      availability: unknown;
    },
  ): PublicVenueDto {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      pricePerHourCents: this.minActiveCourtPrice(row.courts, row.pricePerHourCents),
      availability: (row.availability as Record<string, unknown>) ?? {},
      courts: row.courts
        .filter((c) => c.isActive)
        .map((c) => ({
          id: c.id,
          name: c.name,
          size: c.size,
          pricePerHourCents: c.pricePerHourCents,
        })),
      municipalityCode: row.municipalityCode,
      city: row.city,
      department: row.department,
      latitude: row.latitude,
      longitude: row.longitude,
    };
  }

  private toMyReservationDto(row: {
    id: string;
    userId: string;
    venueId: string | null;
    venueName: string;
    courtId: string | null;
    court: { name: string } | null;
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
      courtId: row.courtId,
      courtName: row.court?.name ?? null,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      status: row.status,
      notes: row.notes,
      matchId: row.matchId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVenueDto(row: VenueWithCourts): VenueDto {
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      address: row.address,
      pricePerHourCents: this.minActiveCourtPrice(row.courts, row.pricePerHourCents),
      availability: (row.availability as Record<string, unknown>) ?? {},
      surfaceType: row.surfaceType,
      courts: row.courts.map((c) => this.toCourtDto(c)),
      municipalityCode: row.municipalityCode,
      city: row.city,
      department: row.department,
      latitude: row.latitude,
      longitude: row.longitude,
      locationSource: row.locationSource,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toReservationDto(row: {
    id: string;
    userId: string;
    user?: { firstname: string; lastname: string } | null;
    venueId: string | null;
    venueName: string;
    courtId: string | null;
    court: { name: string } | null;
    startsAt: Date;
    endsAt: Date;
    status: ReservationStatus;
    source: ReservationSource;
    customerName: string | null;
    customerPhone: string | null;
    notes: string | null;
    createdAt: Date;
  }): ReservationDto {
    return {
      id: row.id,
      userId: row.userId,
      userName: row.user ? `${row.user.firstname} ${row.user.lastname}`.trim() : null,
      venueId: row.venueId,
      venueName: row.venueName,
      courtId: row.courtId,
      courtName: row.court?.name ?? null,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      status: row.status,
      source: row.source,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
