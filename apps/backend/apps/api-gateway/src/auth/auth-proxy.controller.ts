import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ValidateTokenDto,
} from '@ef/contracts';
import { AuthProxyService } from './auth-proxy.service';
import { CurrentUser } from './decorators';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthProxyController {
  constructor(private readonly authProxy: AuthProxyService) {}

  /** Login: límite estricto anti brute-force. */
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authProxy.login(dto);
  }

  /** Registro: evita spam de cuentas. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authProxy.register(dto);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidateTokenDto) {
    return this.authProxy.validateToken(dto.token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { sub: string }) {
    return this.authProxy.getMe(user.sub);
  }

  // ── Recuperación y cambio de contraseña (2026-09-11) ──

  /**
   * Pedir enlace: SIEMPRE 200 { ok: true }, exista o no el correo (anti
   * enumeración; el trabajo y el tiempo también son iguales en auth-service).
   * Throttle por IP: 3 cada 15 min — la capa por email (1/min) vive en el servicio.
   */
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authProxy.forgotPassword(dto);
  }

  /** Canjear el token del enlace. 400 idéntico si es inválido, vencido o ya usado. */
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authProxy.resetPassword(dto);
  }

  /** Cambiar contraseña logueado: la actual es obligatoria. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: { sub: string }) {
    return this.authProxy.changePassword(user.sub, dto);
  }
}
