import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  AddMemberDto,
  CreateGroupDto,
  GroupDetailDto,
  GroupSummaryDto,
  UpdateMemberRoleDto,
} from '@ef/contracts';

@Injectable()
export class GroupsProxyService {
  constructor(
    @Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy,
  ) {}

  create(creatorId: string, dto: CreateGroupDto): Promise<GroupDetailDto> {
    return this.send<GroupDetailDto>(MESSAGE_PATTERNS.GROUPS.CREATE, {
      creatorId,
      ...dto,
    });
  }

  listMine(userId: string): Promise<GroupSummaryDto[]> {
    return this.send<GroupSummaryDto[]>(MESSAGE_PATTERNS.GROUPS.LIST_MINE, {
      userId,
    });
  }

  getDetail(groupId: string, requesterId: string): Promise<GroupDetailDto> {
    return this.send<GroupDetailDto>(MESSAGE_PATTERNS.GROUPS.GET_DETAIL, {
      groupId,
      requesterId,
    });
  }

  addMember(
    groupId: string,
    requesterId: string,
    dto: AddMemberDto,
  ): Promise<GroupDetailDto> {
    return this.send<GroupDetailDto>(MESSAGE_PATTERNS.GROUPS.ADD_MEMBER, {
      groupId,
      requesterId,
      ...dto,
    });
  }

  updateMemberRole(
    groupId: string,
    requesterId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<GroupDetailDto> {
    return this.send<GroupDetailDto>(
      MESSAGE_PATTERNS.GROUPS.UPDATE_MEMBER_ROLE,
      { groupId, requesterId, targetUserId, ...dto },
    );
  }

  removeMember(
    groupId: string,
    requesterId: string,
    targetUserId: string,
  ): Promise<void> {
    return this.send<void>(MESSAGE_PATTERNS.GROUPS.REMOVE_MEMBER, {
      groupId,
      requesterId,
      targetUserId,
    });
  }

  deleteGroup(groupId: string, requesterId: string): Promise<void> {
    return this.send<void>(MESSAGE_PATTERNS.GROUPS.DELETE, {
      groupId,
      requesterId,
    });
  }

  private send<T>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.usersClient.send<T>(pattern, payload).pipe(
        catchError((error: unknown) =>
          throwError(() => toHttpException(error)),
        ),
      ),
    );
  }
}
