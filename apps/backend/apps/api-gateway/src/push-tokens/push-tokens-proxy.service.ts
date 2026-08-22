import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import { RegisterPushTokenDto, RemovePushTokenDto } from '@ef/contracts';

@Injectable()
export class PushTokensProxyService {
  constructor(
    @Inject(SERVICE_NAMES.USERS) private readonly usersClient: ClientProxy,
  ) {}

  register(userId: string, dto: RegisterPushTokenDto): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.PUSH_TOKENS.REGISTER, {
      userId,
      ...dto,
    });
  }

  remove(userId: string, dto: RemovePushTokenDto): Promise<{ success: true }> {
    return this.send<{ success: true }>(MESSAGE_PATTERNS.PUSH_TOKENS.REMOVE, {
      userId,
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
