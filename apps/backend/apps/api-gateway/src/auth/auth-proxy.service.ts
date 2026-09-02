import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  AuthMeResponse,
  AuthResponse,
  CreateVenueOwnerDto,
  LoginDto,
  RegisterDto,
  ValidateTokenResponse,
  VenueOwnerDto,
} from '@ef/contracts';

@Injectable()
export class AuthProxyService {
  constructor(
    @Inject(SERVICE_NAMES.AUTH) private readonly authClient: ClientProxy,
  ) {}

  login(dto: LoginDto): Promise<AuthResponse> {
    return this.send<AuthResponse>(MESSAGE_PATTERNS.AUTH.LOGIN, dto);
  }

  register(dto: RegisterDto): Promise<AuthResponse> {
    return this.send<AuthResponse>(MESSAGE_PATTERNS.AUTH.REGISTER, dto);
  }

  validateToken(token: string): Promise<ValidateTokenResponse> {
    return this.send<ValidateTokenResponse>(
      MESSAGE_PATTERNS.AUTH.VALIDATE_TOKEN,
      { token },
    );
  }

  getMe(userId: string): Promise<AuthMeResponse> {
    return this.send<AuthMeResponse>(MESSAGE_PATTERNS.AUTH.GET_ME, { userId });
  }

  // ── Fase W.3: dueños de cancha (solo Administrador, ver controller) ──

  createVenueOwner(dto: CreateVenueOwnerDto): Promise<VenueOwnerDto> {
    return this.send<VenueOwnerDto>(
      MESSAGE_PATTERNS.ADMIN_USERS.CREATE_VENUE_OWNER,
      dto,
    );
  }

  listVenueOwners(): Promise<VenueOwnerDto[]> {
    return this.send<VenueOwnerDto[]>(
      MESSAGE_PATTERNS.ADMIN_USERS.LIST_VENUE_OWNERS,
      {},
    );
  }

  setVenueOwnerStatus(userId: string, estado: boolean): Promise<VenueOwnerDto> {
    return this.send<VenueOwnerDto>(
      MESSAGE_PATTERNS.ADMIN_USERS.SET_VENUE_OWNER_STATUS,
      { userId, estado },
    );
  }

  private send<T>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.authClient.send<T>(pattern, payload).pipe(
        catchError((error: unknown) =>
          throwError(() => toHttpException(error)),
        ),
      ),
    );
  }
}
