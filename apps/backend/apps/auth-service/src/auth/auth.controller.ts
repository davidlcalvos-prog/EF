import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  AdminUpdateUserEmailPayload,
  ChangePasswordPayload,
  CreateVenueOwnerDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SetVenueOwnerStatusPayload,
  ValidateTokenDto,
} from '@ef/contracts';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Recuperación y cambio de contraseña (2026-09-11) ──

  @MessagePattern(MESSAGE_PATTERNS.AUTH.PASSWORD_FORGOT)
  forgotPassword(@Payload() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.PASSWORD_RESET)
  resetPassword(@Payload() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.PASSWORD_CHANGE)
  changePassword(@Payload() payload: ChangePasswordPayload) {
    return this.authService.changePassword(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.SESSION_STATE)
  sessionState(@Payload() data: { userId: string }) {
    return this.authService.getSessionState(data.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.LOGIN)
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.REGISTER)
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.VALIDATE_TOKEN)
  validateToken(@Payload() dto: ValidateTokenDto) {
    return this.authService.validateToken(dto.token);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.GET_ME)
  getMe(@Payload() data: { userId: string }) {
    return this.authService.getMe(data.userId);
  }

  // ── Fase W.3: dueños de cancha (el gateway restringe a Administrador) ──

  @MessagePattern(MESSAGE_PATTERNS.ADMIN_USERS.CREATE_VENUE_OWNER)
  createVenueOwner(@Payload() dto: CreateVenueOwnerDto) {
    return this.authService.createVenueOwner(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ADMIN_USERS.LIST_VENUE_OWNERS)
  listVenueOwners() {
    return this.authService.listVenueOwners();
  }

  @MessagePattern(MESSAGE_PATTERNS.ADMIN_USERS.SET_VENUE_OWNER_STATUS)
  setVenueOwnerStatus(@Payload() payload: SetVenueOwnerStatusPayload) {
    return this.authService.setVenueOwnerStatus(payload.userId, payload.estado);
  }

  /** Corrección del correo de un usuario (2026-09-11) — el gateway restringe a Administrador. */
  @MessagePattern(MESSAGE_PATTERNS.ADMIN_USERS.UPDATE_USER_EMAIL)
  updateUserEmail(@Payload() payload: AdminUpdateUserEmailPayload) {
    return this.authService.updateUserEmail(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.ADMIN_USERS.FIND_USER_BY_EMAIL)
  findUserByEmail(@Payload() data: { email: string }) {
    return this.authService.findUserByEmailForAdmin(data.email);
  }
}
