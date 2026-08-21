import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  GroupFriendshipActionPayload,
  ListGroupFriendshipsPayload,
  RequestGroupFriendshipPayload,
} from '@ef/contracts';
import { GroupFriendshipsService } from './group-friendships.service';

@Controller()
export class GroupFriendshipsController {
  constructor(private readonly groupFriendshipsService: GroupFriendshipsService) {}

  @MessagePattern(MESSAGE_PATTERNS.GROUP_FRIENDSHIPS.REQUEST)
  request(@Payload() data: RequestGroupFriendshipPayload) {
    return this.groupFriendshipsService.request(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUP_FRIENDSHIPS.LIST_FOR_GROUP)
  listForGroup(@Payload() data: ListGroupFriendshipsPayload) {
    return this.groupFriendshipsService.listForGroup(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUP_FRIENDSHIPS.ACCEPT)
  accept(@Payload() data: GroupFriendshipActionPayload) {
    return this.groupFriendshipsService.accept(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUP_FRIENDSHIPS.REMOVE)
  remove(@Payload() data: GroupFriendshipActionPayload) {
    return this.groupFriendshipsService.remove(data);
  }
}
