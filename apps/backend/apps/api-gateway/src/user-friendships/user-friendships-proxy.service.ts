import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  FriendshipStatusDto,
  UserFriendshipDto,
  UserFriendshipFilter,
} from '@ef/contracts';

@Injectable()
export class UserFriendshipsProxyService {
  constructor(
    @Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy,
  ) {}

  list(
    requesterId: string,
    filter: UserFriendshipFilter,
  ): Promise<UserFriendshipDto[]> {
    return this.send<UserFriendshipDto[]>(MESSAGE_PATTERNS.USER_FRIENDSHIPS.LIST, {
      requesterId,
      filter,
    });
  }

  getStatus(requesterId: string, otherUserId: string): Promise<FriendshipStatusDto> {
    return this.send<FriendshipStatusDto>(
      MESSAGE_PATTERNS.USER_FRIENDSHIPS.GET_STATUS,
      { requesterId, otherUserId },
    );
  }

  request(requesterId: string, userId: string): Promise<UserFriendshipDto> {
    return this.send<UserFriendshipDto>(MESSAGE_PATTERNS.USER_FRIENDSHIPS.REQUEST, {
      requesterId,
      userId,
    });
  }

  accept(friendshipId: string, requesterId: string): Promise<UserFriendshipDto> {
    return this.send<UserFriendshipDto>(MESSAGE_PATTERNS.USER_FRIENDSHIPS.ACCEPT, {
      friendshipId,
      requesterId,
    });
  }

  remove(friendshipId: string, requesterId: string): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.USER_FRIENDSHIPS.REMOVE, {
      friendshipId,
      requesterId,
    });
  }

  private send<T>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.usersClient.send<T>(pattern, payload).pipe(
        catchError((error: unknown) => throwError(() => toHttpException(error))),
      ),
    );
  }
}
