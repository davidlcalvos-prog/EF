import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  ReservationDto,
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
