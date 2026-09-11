import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import { GroupInvitationDto, InviteToGroupDto } from '@ef/contracts';

@Injectable()
export class GroupInvitationsProxyService {
  constructor(@Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy) {}

  invite(groupId: string, requesterId: string, dto: InviteToGroupDto): Promise<GroupInvitationDto> {
    return this.send<GroupInvitationDto>(MESSAGE_PATTERNS.GROUP_INVITATIONS.INVITE, {
      groupId,
      requesterId,
      ...dto,
    });
  }

  listForGroup(groupId: string, requesterId: string): Promise<GroupInvitationDto[]> {
    return this.send<GroupInvitationDto[]>(MESSAGE_PATTERNS.GROUP_INVITATIONS.LIST_FOR_GROUP, {
      groupId,
      requesterId,
    });
  }

  cancel(invitationId: string, requesterId: string): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.GROUP_INVITATIONS.CANCEL, {
      invitationId,
      requesterId,
    });
  }

  listMine(requesterId: string): Promise<GroupInvitationDto[]> {
    return this.send<GroupInvitationDto[]>(MESSAGE_PATTERNS.GROUP_INVITATIONS.LIST_MINE, {
      requesterId,
    });
  }

  accept(invitationId: string, requesterId: string): Promise<GroupInvitationDto> {
    return this.send<GroupInvitationDto>(MESSAGE_PATTERNS.GROUP_INVITATIONS.ACCEPT, {
      invitationId,
      requesterId,
    });
  }

  decline(invitationId: string, requesterId: string): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.GROUP_INVITATIONS.DECLINE, {
      invitationId,
      requesterId,
    });
  }

  private send<T>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.usersClient
        .send<T>(pattern, payload)
        .pipe(catchError((error: unknown) => throwError(() => toHttpException(error)))),
    );
  }
}
