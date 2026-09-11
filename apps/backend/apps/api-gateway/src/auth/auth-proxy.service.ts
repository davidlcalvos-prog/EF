import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { MESSAGE_PATTERNS, SERVICE_NAMES, toHttpException } from '@ef/common';
import {
  AdminUpdateUserEmailDto,
  AdminUserEmailDto,
  AuthMeResponse,
  AuthResponse,
  ChangePasswordDto,
  ChangePasswordResponse,
  CreateVenueOwnerDto,
  ForgotPasswordDto,
  LoginDto,
  PasswordActionResponse,
  RegisterDto,
  ResetPasswordDto,
  SessionStateResponse,
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

  // ── Recuperación y cambio de contraseña (2026-09-11) ──

  forgotPassword(dto: ForgotPasswordDto): Promise<PasswordActionResponse> {
    return this.send<PasswordActionResponse>(MESSAGE_PATTERNS.AUTH.PASSWORD_FORGOT, dto);
  }

  resetPassword(dto: ResetPasswordDto): Promise<PasswordActionResponse> {
    return this.send<PasswordActionResponse>(MESSAGE_PATTERNS.AUTH.PASSWORD_RESET, dto);
  }

  changePassword(userId: string, dto: ChangePasswordDto): Promise<ChangePasswordResponse> {
    return this.send<ChangePasswordResponse>(MESSAGE_PATTERNS.AUTH.PASSWORD_CHANGE, {
      userId,
      ...dto,
    });
  }

  sessionState(userId: string): Promise<SessionStateResponse> {
    return this.send<SessionStateResponse>(MESSAGE_PATTERNS.AUTH.SESSION_STATE, { userId });
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

  /** Id de un usuario por su correo actual (solo Administrador): paso previo a corregirlo sin SQL. */
  findUserByEmail(email: string): Promise<AdminUserEmailDto> {
    return this.send<AdminUserEmailDto>(MESSAGE_PATTERNS.ADMIN_USERS.FIND_USER_BY_EMAIL, { email });
  }

  /** Corrección del correo de un usuario (2026-09-11, solo Administrador). */
  updateUserEmail(userId: string, dto: AdminUpdateUserEmailDto): Promise<AdminUserEmailDto> {
    return this.send<AdminUserEmailDto>(MESSAGE_PATTERNS.ADMIN_USERS.UPDATE_USER_EMAIL, {
      userId,
      ...dto,
    });
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
