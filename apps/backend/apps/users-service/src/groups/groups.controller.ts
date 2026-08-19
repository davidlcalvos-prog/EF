import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  AddMemberPayload,
  CreateGroupPayload,
  GroupActionPayload,
  RemoveMemberPayload,
  UpdateGroupPayload,
  UpdateMemberRolePayload,
  UserIdPayload,
} from '@ef/contracts';
import { GroupsService } from './groups.service';

@Controller()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @MessagePattern(MESSAGE_PATTERNS.GROUPS.CREATE)
  create(@Payload() data: CreateGroupPayload) {
    return this.groupsService.create(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUPS.LIST_MINE)
  listMine(@Payload() data: UserIdPayload) {
    return this.groupsService.listMine(data.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUPS.GET_DETAIL)
  getDetail(@Payload() data: GroupActionPayload) {
    return this.groupsService.getDetail(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUPS.UPDATE)
  update(@Payload() data: UpdateGroupPayload) {
    return this.groupsService.update(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUPS.ADD_MEMBER)
  addMember(@Payload() data: AddMemberPayload) {
    return this.groupsService.addMember(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUPS.UPDATE_MEMBER_ROLE)
  updateMemberRole(@Payload() data: UpdateMemberRolePayload) {
    return this.groupsService.updateMemberRole(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUPS.REMOVE_MEMBER)
  removeMember(@Payload() data: RemoveMemberPayload) {
    return this.groupsService.removeMember(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.GROUPS.DELETE)
  deleteGroup(@Payload() data: GroupActionPayload) {
    return this.groupsService.deleteGroup(data);
  }
}
