import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  ApplyGuestRequestPayload,
  GetGuestRequestForMatchPayload,
  GuestApplicationActionPayload,
  ListGuestApplicationsPayload,
  ListNearbyGuestRequestsPayload,
  MatchGuestRequestActionPayload,
  OpenGuestRequestPayload,
  WithdrawGuestApplicationPayload,
} from '@ef/contracts';
import { MatchGuestRequestsService } from './match-guest-requests.service';

@Controller()
export class MatchGuestRequestsController {
  constructor(private readonly guestRequestsService: MatchGuestRequestsService) {}

  @MessagePattern(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.OPEN)
  open(@Payload() data: OpenGuestRequestPayload) {
    return this.guestRequestsService.open(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.CANCEL)
  cancel(@Payload() data: MatchGuestRequestActionPayload) {
    return this.guestRequestsService.cancel(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.LIST_NEARBY)
  listNearby(@Payload() data: ListNearbyGuestRequestsPayload) {
    return this.guestRequestsService.listNearby(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.GET_FOR_MATCH)
  getForMatch(@Payload() data: GetGuestRequestForMatchPayload) {
    return this.guestRequestsService.getForMatch(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.APPLY)
  apply(@Payload() data: ApplyGuestRequestPayload) {
    return this.guestRequestsService.apply(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.WITHDRAW)
  withdraw(@Payload() data: WithdrawGuestApplicationPayload) {
    return this.guestRequestsService.withdraw(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.LIST_APPLICATIONS)
  listApplications(@Payload() data: ListGuestApplicationsPayload) {
    return this.guestRequestsService.listApplications(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.ACCEPT)
  accept(@Payload() data: GuestApplicationActionPayload) {
    return this.guestRequestsService.accept(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.REJECT)
  reject(@Payload() data: GuestApplicationActionPayload) {
    return this.guestRequestsService.reject(data);
  }
}
