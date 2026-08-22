import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { AuthTokenPayload, RegisterPushTokenDto, RemovePushTokenDto } from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PushTokensProxyService } from './push-tokens-proxy.service';

/**
 * Registro de push tokens (Fase 6.5.5.1). JWT obligatorio — un token siempre
 * pertenece al usuario autenticado, nunca se recibe userId en el body.
 */
@Controller('push-tokens')
@UseGuards(JwtAuthGuard)
export class PushTokensProxyController {
  constructor(private readonly pushTokensProxy: PushTokensProxyService) {}

  @Post()
  register(@Body() dto: RegisterPushTokenDto, @CurrentUser() user: AuthTokenPayload) {
    return this.pushTokensProxy.register(user.sub, dto);
  }

  /** Sin `token` en el body: borra todos los del usuario (logout general). */
  @Delete()
  remove(@Body() dto: RemovePushTokenDto, @CurrentUser() user: AuthTokenPayload) {
    return this.pushTokensProxy.remove(user.sub, dto);
  }
}
