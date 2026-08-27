import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  CourtDto,
  CreateCourtDto,
  CreatePhoneReservationDto,
  ReassignReservationCourtDto,
  ReservationDto,
  UpdateCourtDto,
  UpdateReservationStatusDto,
  UpsertVenueDto,
  VenueDto,
} from '@ef/contracts';

@Injectable()
export class VenuesProxyService {
  constructor(
    @Inject(SERVICE_NAMES.VENUES) private readonly venuesClient: ClientProxy,
  ) {}

  listMine(ownerId: string): Promise<VenueDto[]> {
    return this.send<VenueDto[]>(MESSAGE_PATTERNS.VENUES.LIST_MINE, {
      ownerId,
    });
  }

  upsertMine(ownerId: string, dto: UpsertVenueDto): Promise<VenueDto> {
    return this.send<VenueDto>(MESSAGE_PATTERNS.VENUES.UPSERT_MINE, {
      ownerId,
      ...dto,
    });
  }

  listReservationsMine(ownerId: string): Promise<ReservationDto[]> {
    return this.send<ReservationDto[]>(
      MESSAGE_PATTERNS.VENUES.LIST_RESERVATIONS_MINE,
      { ownerId },
    );
  }

  updateReservationStatus(
    ownerId: string,
    reservationId: string,
    dto: UpdateReservationStatusDto,
  ): Promise<ReservationDto> {
    return this.send<ReservationDto>(
      MESSAGE_PATTERNS.VENUES.UPDATE_RESERVATION_STATUS,
      { ownerId, reservationId, status: dto.status },
    );
  }

  // --- Courts (Fase W.1) ---

  createCourt(ownerId: string, venueId: string, dto: CreateCourtDto): Promise<CourtDto> {
    return this.send<CourtDto>(MESSAGE_PATTERNS.VENUES.CREATE_COURT, {
      ownerId,
      venueId,
      ...dto,
    });
  }

  updateCourt(ownerId: string, courtId: string, dto: UpdateCourtDto): Promise<CourtDto> {
    return this.send<CourtDto>(MESSAGE_PATTERNS.VENUES.UPDATE_COURT, {
      ownerId,
      courtId,
      ...dto,
    });
  }

  deactivateCourt(ownerId: string, courtId: string): Promise<CourtDto> {
    return this.send<CourtDto>(MESSAGE_PATTERNS.VENUES.DEACTIVATE_COURT, {
      ownerId,
      courtId,
    });
  }

  createPhoneReservation(
    ownerId: string,
    dto: CreatePhoneReservationDto,
  ): Promise<ReservationDto> {
    return this.send<ReservationDto>(
      MESSAGE_PATTERNS.VENUES.CREATE_PHONE_RESERVATION,
      { ownerId, ...dto },
    );
  }

  /** Fase W.1.1: reasignación manual del dueño (ej. mantenimiento de último momento). */
  reassignCourt(
    ownerId: string,
    reservationId: string,
    dto: ReassignReservationCourtDto,
  ): Promise<ReservationDto> {
    return this.send<ReservationDto>(MESSAGE_PATTERNS.VENUES.REASSIGN_COURT, {
      ownerId,
      reservationId,
      ...dto,
    });
  }

  private send<T>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.venuesClient.send<T>(pattern, payload).pipe(
        catchError((error: unknown) =>
          throwError(() => toHttpException(error)),
        ),
      ),
    );
  }
}
