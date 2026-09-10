import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthTokenPayload } from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PendingProxyService } from './pending-proxy.service';

/**
 * `GET /api/me/pending` → conteo de pendientes del usuario autenticado
 * (Fase B, indicadores en el drawer). Cuatro `count`, nunca listas.
 * Claves = `PendingKind` del contrato PushData.
 */
@Controller('me')
@UseGuards(JwtAuthGuard)
export class PendingProxyController {
  constructor(private readonly pendingProxy: PendingProxyService) {}

  @Get('pending')
  counts(@CurrentUser() user: AuthTokenPayload) {
    return this.pendingProxy.counts(user.sub);
  }
}
