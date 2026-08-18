import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  CreateMatchDto,
  MatchDto,
  MatchSummaryDto,
  UpdateMatchStatusDto,
} from '@ef/contracts';

@Injectable()
export class MatchesProxyService {
  constructor(
    @Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy,
  ) {}

  create(requesterId: string, dto: CreateMatchDto): Promise<MatchDto> {
    return this.send<MatchDto>(MESSAGE_PATTERNS.MATCHES.CREATE, {
      requesterId,
      ...dto,
    });
  }

  getDetail(matchId: string, requesterId: string): Promise<MatchDto> {
    return this.send<MatchDto>(MESSAGE_PATTERNS.MATCHES.GET_DETAIL, {
      matchId,
      requesterId,
    });
  }

  listMine(userId: string): Promise<MatchSummaryDto[]> {
    return this.send<MatchSummaryDto[]>(MESSAGE_PATTERNS.MATCHES.LIST_MINE, {
      userId,
    });
  }

  listByGroup(groupId: string, requesterId: string): Promise<MatchSummaryDto[]> {
    return this.send<MatchSummaryDto[]>(MESSAGE_PATTERNS.MATCHES.LIST_BY_GROUP, {
      groupId,
      requesterId,
    });
  }

  accept(matchId: string, requesterId: string): Promise<MatchDto> {
    return this.send<MatchDto>(MESSAGE_PATTERNS.MATCHES.ACCEPT, {
      matchId,
      requesterId,
    });
  }

  reject(matchId: string, requesterId: string): Promise<MatchDto> {
    return this.send<MatchDto>(MESSAGE_PATTERNS.MATCHES.REJECT, {
      matchId,
      requesterId,
    });
  }

  join(matchId: string, requesterId: string): Promise<MatchDto> {
    return this.send<MatchDto>(MESSAGE_PATTERNS.MATCHES.JOIN, {
      matchId,
      requesterId,
    });
  }

  leave(matchId: string, requesterId: string): Promise<MatchDto> {
    return this.send<MatchDto>(MESSAGE_PATTERNS.MATCHES.LEAVE, {
      matchId,
      requesterId,
    });
  }

  updateStatus(
    matchId: string,
    requesterId: string,
    dto: UpdateMatchStatusDto,
  ): Promise<MatchDto> {
    return this.send<MatchDto>(MESSAGE_PATTERNS.MATCHES.UPDATE_STATUS, {
      matchId,
      requesterId,
      ...dto,
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
