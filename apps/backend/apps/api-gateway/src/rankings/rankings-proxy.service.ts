import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import { GlobalRankingsResponse } from '@ef/contracts';

@Injectable()
export class RankingsProxyService {
  constructor(
    @Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy,
  ) {}

  getGlobal(): Promise<GlobalRankingsResponse> {
    return firstValueFrom(
      this.usersClient
        .send<GlobalRankingsResponse>(MESSAGE_PATTERNS.RANKINGS.GET_GLOBAL, {})
        .pipe(catchError((error: unknown) => throwError(() => toHttpException(error)))),
    );
  }
}
