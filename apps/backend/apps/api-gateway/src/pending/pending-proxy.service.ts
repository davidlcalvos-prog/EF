import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import { PendingCountsDto } from '@ef/contracts';

@Injectable()
export class PendingProxyService {
  constructor(@Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy) {}

  counts(userId: string): Promise<PendingCountsDto> {
    return firstValueFrom(
      this.usersClient
        .send<PendingCountsDto>(MESSAGE_PATTERNS.PENDING.COUNTS, { userId })
        .pipe(catchError((error: unknown) => throwError(() => toHttpException(error)))),
    );
  }
}
