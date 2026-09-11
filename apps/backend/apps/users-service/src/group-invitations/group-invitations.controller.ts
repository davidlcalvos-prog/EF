import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  GroupInvitationActionPayload,
  InviteToGroupPayload,
  ListGroupInvitationsPayload,
  ListMyGroupInvitationsPayload,
} from '@ef/contracts';
import { GroupInvitationsService } from './group-invitations.service';

@Controller()
export class GroupInvitationsController {
  constructor(private readonly groupInvitationsService: GroupInvitationsService) {}

  @MessagePattern(MESSAGE_PATTERNS.GROUP_INVITATIONS.INVITE)
  invite(@Payload() data: InviteToGroupPayload) {
    return this.groupInvitationsService.invite(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUP_INVITATIONS.LIST_FOR_GROUP)
  listForGroup(@Payload() data: ListGroupInvitationsPayload) {
    return this.groupInvitationsService.listForGroup(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUP_INVITATIONS.CANCEL)
  cancel(@Payload() data: GroupInvitationActionPayload) {
    return this.groupInvitationsService.cancel(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUP_INVITATIONS.LIST_MINE)
  listMine(@Payload() data: ListMyGroupInvitationsPayload) {
    return this.groupInvitationsService.listMine(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUP_INVITATIONS.ACCEPT)
  accept(@Payload() data: GroupInvitationActionPayload) {
    return this.groupInvitationsService.accept(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUP_INVITATIONS.DECLINE)
  decline(@Payload() data: GroupInvitationActionPayload) {
    return this.groupInvitationsService.decline(data);
  }
}
