import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import { GroupFriendshipDto, RequestGroupFriendshipDto } from '@ef/contracts';

@Injectable()
export class GroupFriendshipsProxyService {
  constructor(
    @Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy,
  ) {}

  listForGroup(groupId: string, requesterId: string): Promise<GroupFriendshipDto[]> {
    return this.send<GroupFriendshipDto[]>(
      MESSAGE_PATTERNS.GROUP_FRIENDSHIPS.LIST_FOR_GROUP,
      { groupId, requesterId },
    );
  }

  request(
    groupId: string,
    requesterId: string,
    dto: RequestGroupFriendshipDto,
  ): Promise<GroupFriendshipDto> {
    return this.send<GroupFriendshipDto>(MESSAGE_PATTERNS.GROUP_FRIENDSHIPS.REQUEST, {
      groupId,
      requesterId,
      ...dto,
    });
  }

  accept(friendshipId: string, requesterId: string): Promise<GroupFriendshipDto> {
    return this.send<GroupFriendshipDto>(MESSAGE_PATTERNS.GROUP_FRIENDSHIPS.ACCEPT, {
      friendshipId,
      requesterId,
    });
  }

  remove(friendshipId: string, requesterId: string): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.GROUP_FRIENDSHIPS.REMOVE, {
      friendshipId,
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
