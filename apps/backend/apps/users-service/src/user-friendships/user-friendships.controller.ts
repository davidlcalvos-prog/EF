import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  GetFriendshipStatusPayload,
  ListUserFriendshipsPayload,
  RequestUserFriendshipPayload,
  UserFriendshipActionPayload,
} from '@ef/contracts';
import { UserFriendshipsService } from './user-friendships.service';

@Controller()
export class UserFriendshipsController {
  constructor(private readonly userFriendshipsService: UserFriendshipsService) {}

  @MessagePattern(MESSAGE_PATTERNS.USER_FRIENDSHIPS.LIST)
  list(@Payload() data: ListUserFriendshipsPayload) {
    return this.userFriendshipsService.list(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.USER_FRIENDSHIPS.GET_STATUS)
  getStatus(@Payload() data: GetFriendshipStatusPayload) {
    return this.userFriendshipsService.getStatus(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.USER_FRIENDSHIPS.REQUEST)
  request(@Payload() data: RequestUserFriendshipPayload) {
    return this.userFriendshipsService.request(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.USER_FRIENDSHIPS.ACCEPT)
  accept(@Payload() data: UserFriendshipActionPayload) {
    return this.userFriendshipsService.accept(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.USER_FRIENDSHIPS.REMOVE)
  remove(@Payload() data: UserFriendshipActionPayload) {
    return this.userFriendshipsService.remove(data);
  }
}
