import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  CreateMatchPayload,
  ListByGroupPayload,
  MatchActionPayload,
  UpdateMatchStatusPayload,
  UserIdPayload,
} from '@ef/contracts';
import { MatchesService } from './matches.service';

@Controller()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @MessagePattern(MESSAGE_PATTERNS.MATCHES.CREATE)
  create(@Payload() data: CreateMatchPayload) {
    return this.matchesService.create(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCHES.GET_DETAIL)
  getDetail(@Payload() data: MatchActionPayload) {
    return this.matchesService.getDetail(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCHES.LIST_MINE)
  listMine(@Payload() data: UserIdPayload) {
    return this.matchesService.listMine(data.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCHES.LIST_BY_GROUP)
  listByGroup(@Payload() data: ListByGroupPayload) {
    return this.matchesService.listByGroup(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCHES.ACCEPT)
  accept(@Payload() data: MatchActionPayload) {
    return this.matchesService.accept(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCHES.REJECT)
  reject(@Payload() data: MatchActionPayload) {
    return this.matchesService.reject(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCHES.JOIN)
  join(@Payload() data: MatchActionPayload) {
    return this.matchesService.join(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCHES.LEAVE)
  leave(@Payload() data: MatchActionPayload) {
    return this.matchesService.leave(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.MATCHES.UPDATE_STATUS)
  updateStatus(@Payload() data: UpdateMatchStatusPayload) {
    return this.matchesService.updateStatus(data);
  }
}
