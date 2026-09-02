import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import {
  CreateVenueOwnerDto,
  LoginDto,
  RegisterDto,
  SetVenueOwnerStatusPayload,
  ValidateTokenDto,
} from '@ef/contracts';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
