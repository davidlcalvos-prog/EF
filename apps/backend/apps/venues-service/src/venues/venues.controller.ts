import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  CancelReservationPayload,
  CreateReservationPayload,
  OwnerPayload,
  UpdateReservationStatusPayload,
  UpsertVenuePayload,
  UserIdPayload,
} from '@ef/contracts';
import { VenuesService } from './venues.service';

@Controller()
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @MessagePattern(MESSAGE_PATTERNS.VENUES.LIST_MINE)
  listMine(@Payload() data: OwnerPayload) {
    return this.venuesService.listMine(data.ownerId);
  }

  @MessagePattern(MESSAGE_PATTERNS.VENUES.UPSERT_MINE)
  upsertMine(@Payload() data: UpsertVenuePayload) {
    return this.venuesService.upsertMine(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.VENUES.LIST_RESERVATIONS_MINE)
  listReservationsMine(@Payload() data: OwnerPayload) {
    return this.venuesService.listReservationsMine(data.ownerId);
  }

  @MessagePattern(MESSAGE_PATTERNS.VENUES.UPDATE_RESERVATION_STATUS)
  updateReservationStatus(@Payload() data: UpdateReservationStatusPayload) {
    return this.venuesService.updateReservationStatus(data);
  }

  // --- Lado jugador (Fase 4) ---

  @MessagePattern(MESSAGE_PATTERNS.VENUES.LIST_PUBLIC)
  listPublic() {
    return this.venuesService.listPublicVenues();
  }

  @MessagePattern(MESSAGE_PATTERNS.VENUES.CREATE_RESERVATION)
  createReservation(@Payload() data: CreateReservationPayload) {
    return this.venuesService.createReservation(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.VENUES.LIST_MY_RESERVATIONS)
  listMyReservations(@Payload() data: UserIdPayload) {
    return this.venuesService.listMyReservations(data.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.VENUES.GET_MY_RESERVATION)
  getMyReservation(@Payload() data: CancelReservationPayload) {
    return this.venuesService.getMyReservation(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.VENUES.CANCEL_RESERVATION)
  cancelReservation(@Payload() data: CancelReservationPayload) {
    return this.venuesService.cancelReservation(data);
  }
}
