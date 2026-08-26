import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { findMunicipality, haversineKm } from '@ef/common';
import {
  CancelReservationPayload,
  CreateReservationPayload,
  MyReservationDto,
  PublicVenueDto,
  ReservationDto,
  UpdateReservationStatusPayload,
  UpsertVenuePayload,
  VenueDto,
} from '@ef/contracts';
import { GroupRole } from '@prisma/client';
import { VenueRepository } from './repositories/venue.repository';

const GROUP_LEADER_ROLES: GroupRole[] = ['creator', 'admin'];

@Injectable()
export class VenuesService {
  constructor(private readonly venueRepository: VenueRepository) {}

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

  listReservationsMine(ownerId: string): Promise<ReservationDto[]> {
    return this.venueRepository.listReservationsForOwner(ownerId);
  }

  updateReservationStatus(
    payload: UpdateReservationStatusPayload,
  ): Promise<ReservationDto> {
    return this.venueRepository.updateReservationStatus(
      payload.ownerId,
      payload.reservationId,
      payload.status,
    );
  }

  // --- Lado jugador (Fase 4) ---

  listPublicVenues(municipalityCode?: string): Promise<PublicVenueDto[]> {
    return this.venueRepository.listPublic(municipalityCode);
  }

  async createReservation(
    payload: CreateReservationPayload,
  ): Promise<MyReservationDto> {
    const venue = await this.venueRepository.findVenueById(payload.venueId);
    if (!venue) {
      throw new NotFoundException(`Venue ${payload.venueId} not found`);
    }

    const startsAt = new Date(payload.startsAt);
    const endsAt = new Date(payload.endsAt);
    if (endsAt <= startsAt) {
      throw new ConflictException('endsAt must be after startsAt');
    }

    const overlaps = await this.venueRepository.hasOverlappingReservation(
      payload.venueId,
      startsAt,
      endsAt,
    );
    if (overlaps) {
      throw new ConflictException(
        'This venue already has a reservation in that time range',
      );
    }

    if (payload.matchId) {
      await this.requireCanLinkMatch(payload.matchId, payload.requesterId);
    }

    return this.venueRepository.createReservation({
      userId: payload.requesterId,
      venueId: payload.venueId,
      venueName: venue.name,
      startsAt,
      endsAt,
      notes: payload.notes,
      matchId: payload.matchId,
    });
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
