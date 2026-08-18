import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import { CreateReservationDto, MyReservationDto, PublicVenueDto } from '@ef/contracts';

@Injectable()
export class ReservationsProxyService {
  constructor(
    @Inject(SERVICE_NAMES.VENUES) private readonly venuesClient: ClientProxy,
  ) {}

  listPublicVenues(): Promise<PublicVenueDto[]> {
    return this.send<PublicVenueDto[]>(MESSAGE_PATTERNS.VENUES.LIST_PUBLIC, {});
  }

  createReservation(
    requesterId: string,
    dto: CreateReservationDto,
  ): Promise<MyReservationDto> {
    return this.send<MyReservationDto>(MESSAGE_PATTERNS.VENUES.CREATE_RESERVATION, {
      requesterId,
      ...dto,
    });
  }

  listMine(userId: string): Promise<MyReservationDto[]> {
    return this.send<MyReservationDto[]>(
      MESSAGE_PATTERNS.VENUES.LIST_MY_RESERVATIONS,
      { userId },
    );
  }

  getMine(reservationId: string, requesterId: string): Promise<MyReservationDto> {
    return this.send<MyReservationDto>(MESSAGE_PATTERNS.VENUES.GET_MY_RESERVATION, {
      reservationId,
      requesterId,
    });
  }

  cancel(reservationId: string, requesterId: string): Promise<MyReservationDto> {
    return this.send<MyReservationDto>(MESSAGE_PATTERNS.VENUES.CANCEL_RESERVATION, {
      reservationId,
      requesterId,
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
