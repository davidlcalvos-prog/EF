import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RankingsProxyService } from './rankings-proxy.service';

/** Rankings globales (Fase 9) — cualquier usuario autenticado, sin RolesGuard. */
@Controller('rankings')
@UseGuards(JwtAuthGuard)
export class RankingsProxyController {
  constructor(private readonly rankingsProxy: RankingsProxyService) {}

  @Get()
  getGlobal() {
    return this.rankingsProxy.getGlobal();
  }
}
