import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  MatchGuestApplicationDto,
  MatchGuestRequestDto,
  OpenGuestRequestDto,
} from '@ef/contracts';

@Injectable()
export class MatchGuestRequestsProxyService {
  constructor(
    @Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy,
  ) {}

  open(
    matchId: string,
    requesterId: string,
    dto: OpenGuestRequestDto,
  ): Promise<MatchGuestRequestDto> {
    return this.send<MatchGuestRequestDto>(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.OPEN, {
      matchId,
      requesterId,
      ...dto,
    });
  }

  cancel(matchId: string, requesterId: string): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.CANCEL, {
      matchId,
      requesterId,
    });
  }

  listNearby(userId: string): Promise<MatchGuestRequestDto[]> {
    return this.send<MatchGuestRequestDto[]>(
      MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.LIST_NEARBY,
      { userId },
    );
  }

  getForMatch(matchId: string, requesterId: string): Promise<MatchGuestRequestDto> {
    return this.send<MatchGuestRequestDto>(
      MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.GET_FOR_MATCH,
      { matchId, requesterId },
    );
  }

  apply(requestId: string, userId: string): Promise<MatchGuestRequestDto> {
    return this.send<MatchGuestRequestDto>(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.APPLY, {
      requestId,
      userId,
    });
  }

  withdraw(applicationId: string, userId: string): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.WITHDRAW, {
      applicationId,
      userId,
    });
  }

  listApplications(
    requestId: string,
    requesterId: string,
  ): Promise<MatchGuestApplicationDto[]> {
    return this.send<MatchGuestApplicationDto[]>(
      MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.LIST_APPLICATIONS,
      { requestId, requesterId },
    );
  }

  accept(applicationId: string, requesterId: string): Promise<MatchGuestApplicationDto> {
    return this.send<MatchGuestApplicationDto>(
      MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.ACCEPT,
      { applicationId, requesterId },
    );
  }

  reject(applicationId: string, requesterId: string): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.MATCH_GUEST_REQUESTS.REJECT, {
      applicationId,
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
