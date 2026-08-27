import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { findMunicipality, haversineKm } from '@ef/common';
import {
  AvailabilityDto,
  AvailabilityQueryDto,
  CancelReservationPayload,
  CourtDto,
  CreateCourtPayload,
  CreatePhoneReservationPayload,
  CreateReservationPayload,
  DeactivateCourtPayload,
  MyReservationDto,
  PublicVenueDto,
  ReassignReservationCourtPayload,
  ReservationDto,
  UpdateCourtPayload,
  UpdateReservationStatusPayload,
  UpsertVenuePayload,
  VenueDto,
} from '@ef/contracts';
import { GroupRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { VenueRepository } from './repositories/venue.repository';

const GROUP_LEADER_ROLES: GroupRole[] = ['creator', 'admin'];

@Injectable()
export class VenuesService {
  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  listMine(ownerId: string): Promise<VenueDto[]> {
    return this.venueRepository.listByOwner(ownerId);
  }

  upsertMine(payload: UpsertVenuePayload): Promise<VenueDto> {
    const { ownerId, municipalityCode, latitude, longitude, ...dto } = payload;
    const location = this.resolveVenueLocation(municipalityCode, latitude, longitude);
    return this.venueRepository.upsertForOwner(ownerId, dto, location);
  }

  /**
   * Fase L.0: única entidad que acepta coordenadas del cliente (el pin del
   * dueño). Con pin: locationSource=pin, validado a <50 km del centroide del
   * municipio (evita pines en el océano). Sin pin: centroide + municipality.
   * undefined = no tocar la ubicación; null = limpiarla.
   */
  private resolveVenueLocation(
    municipalityCode: string | null | undefined,
    latitude: number | undefined,
    longitude: number | undefined,
  ) {
    if (municipalityCode === undefined) {
      if (latitude !== undefined || longitude !== undefined) {
        throw new BadRequestException(
          'latitude/longitude require a municipalityCode',
        );
      }
      return undefined;
    }
    if (municipalityCode === null) {
      return null;
    }
    const municipality = findMunicipality(municipalityCode);
    if (!municipality) {
      throw new BadRequestException(
        `Unknown municipalityCode ${municipalityCode}`,
      );
    }
    const hasPin = latitude !== undefined && longitude !== undefined;
    if ((latitude !== undefined) !== (longitude !== undefined)) {
      throw new BadRequestException('latitude and longitude must come together');
    }
    if (hasPin) {
      const distance = haversineKm(
        { lat: latitude, lng: longitude },
        { lat: municipality.lat, lng: municipality.lng },
      );
      if (distance > 50) {
        throw new BadRequestException(
          `The pin is ${Math.round(distance)} km away from ${municipality.name} — move it inside the municipality`,
        );
      }
    }
    return {
      municipalityCode: municipality.code,
      city: municipality.name,
      department: municipality.department,
      latitude: hasPin ? latitude : municipality.lat,
      longitude: hasPin ? longitude : municipality.lng,
      locationSource: (hasPin ? 'pin' : 'municipality') as 'pin' | 'municipality',
    };
  }

  // --- Courts (Fase W.1) ---

  createCourt(payload: CreateCourtPayload): Promise<CourtDto> {
    const { ownerId, venueId, ...dto } = payload;
    return this.venueRepository.createCourt(ownerId, venueId, dto);
  }

  updateCourt(payload: UpdateCourtPayload): Promise<CourtDto> {
    const { ownerId, courtId, ...dto } = payload;
    return this.venueRepository.updateCourt(ownerId, courtId, dto);
  }

  deactivateCourt(payload: DeactivateCourtPayload): Promise<CourtDto> {
    return this.venueRepository.deactivateCourt(payload.ownerId, payload.courtId);
  }

  listReservationsMine(ownerId: string): Promise<ReservationDto[]> {
    return this.venueRepository.listReservationsForOwner(ownerId);
  }

  /**
   * El dueño confirma o rechaza (cancelled) una reserva de su venue. Si era
   * source=app, el jugador recibe push en ambos casos (A.3) — las
   * telefónicas ya nacen confirmed y normalmente no pasan por acá.
   */
  async updateReservationStatus(
    payload: UpdateReservationStatusPayload,
  ): Promise<ReservationDto> {
    const updated = await this.venueRepository.updateReservationStatus(
      payload.ownerId,
      payload.reservationId,
      payload.status,
    );

    if (updated.source === 'app') {
      const title =
        payload.status === 'confirmed'
          ? '¡Tu reserva fue confirmada!'
          : 'Tu reserva fue rechazada';
      const body =
        payload.status === 'confirmed'
          ? `Tu reserva en ${updated.courtName ?? updated.venueName} quedó confirmada.`
          : `Tu reserva en ${updated.courtName ?? updated.venueName} fue rechazada por el dueño.`;
      await this.notificationsService.sendToUser(updated.userId, title, body, {
        type: 'reservation_status',
        reservationId: updated.id,
      });
    }

    return updated;
  }

  /** Reserva telefónica (Fase W.1): el dueño la carga ya confirmed, sin pasar por el jugador. */
  createPhoneReservation(payload: CreatePhoneReservationPayload): Promise<ReservationDto> {
    const { ownerId, courtId, startsAt, endsAt, customerName, customerPhone, notes } = payload;
    const startsAtDate = new Date(startsAt);
    const endsAtDate = new Date(endsAt);
    if (endsAtDate <= startsAtDate) {
      throw new ConflictException('endsAt must be after startsAt');
    }
    return this.venueRepository.createPhoneReservation({
      ownerId,
      courtId,
      startsAt: startsAtDate,
      endsAt: endsAtDate,
      customerName,
      customerPhone,
      notes,
    });
  }

  // --- Lado jugador (Fase 4) ---

  listPublicVenues(municipalityCode?: string): Promise<PublicVenueDto[]> {
    return this.venueRepository.listPublic(municipalityCode);
  }

  /** Fase W.1.1: cuántas courts de ese tamaño quedan libres — el mobile lo consulta antes de dejar confirmar. */
  getAvailability(query: AvailabilityQueryDto): Promise<AvailabilityDto> {
    const startsAt = new Date(query.startsAt);
    const endsAt = new Date(query.endsAt);
    if (endsAt <= startsAt) {
      throw new ConflictException('endsAt must be after startsAt');
    }
    return this.venueRepository.getAvailability(query.venueId, query.size, startsAt, endsAt);
  }

  /**
   * Fase W.1.1: el jugador elige complejo + tamaño, no una cancha puntual —
   * el repositorio auto-asigna con lock dentro de una transacción (mismo
   * patrón que el roster de Fase 8.2). 409 con mensaje claro si no hay
   * ninguna libre, en vez de dejar que choque con un solape al final.
   */
  async createReservation(
    payload: CreateReservationPayload,
  ): Promise<MyReservationDto> {
    const startsAt = new Date(payload.startsAt);
    const endsAt = new Date(payload.endsAt);
    if (endsAt <= startsAt) {
      throw new ConflictException('endsAt must be after startsAt');
    }

    if (payload.matchId) {
      await this.requireCanLinkMatch(payload.matchId, payload.requesterId);
    }

    const created = await this.venueRepository.createReservationWithAutoAssign({
      userId: payload.requesterId,
      venueId: payload.venueId,
      size: payload.size,
      startsAt,
      endsAt,
      notes: payload.notes,
      matchId: payload.matchId,
    });

    const ownerId = await this.venueRepository.findVenueOwnerId(payload.venueId);
    if (ownerId) {
      await this.notificationsService.sendToUser(
        ownerId,
        'Nueva reserva pendiente',
        `Tenés una reserva pendiente en ${created.courtName ?? created.venueName}.`,
        { type: 'new_reservation', reservationId: created.id },
      );
    }

    return created;
  }

  /**
   * Reasignación manual del dueño (Fase W.1.1) — ej. mantenimiento de
   * último momento. Solo entre canchas del mismo tamaño, y solo si la
   * reserva sigue vigente (no cancelled, no ya empezada) — validado en el
   * repositorio. Push al jugador solo si era source=app.
   */
  async reassignCourt(payload: ReassignReservationCourtPayload): Promise<ReservationDto> {
    const updated = await this.venueRepository.reassignCourt(
      payload.ownerId,
      payload.reservationId,
      payload.courtId,
    );

    if (updated.source === 'app') {
      await this.notificationsService.sendToUser(
        updated.userId,
        'Tu reserva fue reasignada',
        `Tu reserva ahora es en ${updated.courtName ?? updated.venueName}.`,
        { type: 'reservation_status', reservationId: updated.id },
      );
    }

    return updated;
  }

  async getMyReservation(
    payload: CancelReservationPayload,
  ): Promise<MyReservationDto> {
    return this.requireOwnReservation(payload.reservationId, payload.requesterId);
  }

  listMyReservations(userId: string): Promise<MyReservationDto[]> {
    return this.venueRepository.listMyReservations(userId);
  }

  async cancelReservation(
    payload: CancelReservationPayload,
  ): Promise<MyReservationDto> {
    const reservation = await this.requireOwnReservation(
      payload.reservationId,
      payload.requesterId,
    );

    if (reservation.status === 'cancelled') {
      throw new ConflictException('Reservation is already cancelled');
    }
    if (new Date(reservation.startsAt).getTime() <= Date.now()) {
      throw new ConflictException(
        'Cannot cancel a reservation that has already started',
      );
    }

    return this.venueRepository.cancelReservation(payload.reservationId);
  }

  private async requireOwnReservation(
    reservationId: string,
    requesterId: string,
  ): Promise<MyReservationDto> {
    const reservation = await this.venueRepository.findReservationById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }
    if (reservation.userId !== requesterId) {
      throw new ForbiddenException('This is not your reservation');
    }
    return reservation;
  }

  private async requireCanLinkMatch(
    matchId: string,
    requesterId: string,
  ): Promise<void> {
    const groups = await this.venueRepository.findMatchGroups(matchId);
    if (!groups) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }

    const alreadyLinked = await this.venueRepository.hasReservationForMatch(matchId);
    if (alreadyLinked) {
      throw new ConflictException('This match already has a linked reservation');
    }

    const originRole = await this.venueRepository.findGroupMembershipRole(
      groups.originGroupId,
      requesterId,
    );
    if (originRole && GROUP_LEADER_ROLES.includes(originRole)) return;

    if (groups.opponentGroupId) {
      const opponentRole = await this.venueRepository.findGroupMembershipRole(
        groups.opponentGroupId,
        requesterId,
      );
      if (opponentRole && GROUP_LEADER_ROLES.includes(opponentRole)) return;
    }

    throw new ForbiddenException(
      'Only the creator or an admin of the match group can link a reservation',
    );
  }
}
