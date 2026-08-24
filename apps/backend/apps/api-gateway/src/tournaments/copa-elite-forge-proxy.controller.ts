import { Controller, Get, UseGuards } from '@nestjs/common';
import { SYSTEM_ROLE_NAMES } from '@ef/common';
import { CurrentUser, Roles } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TournamentsProxyService } from './tournaments-proxy.service';

/** "Copa Elite Forge" del dueño de cancha (Fase 7.2) — partidos de elite_forge asignados a su cancha sintética. */
@Controller('copa-elite-forge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLE_NAMES.EMPRESARIO, SYSTEM_ROLE_NAMES.ADMINISTRADOR)
export class CopaEliteForgeProxyController {
  constructor(private readonly tournamentsProxy: TournamentsProxyService) {}

  @Get()
  listAssignedMatches(@CurrentUser() user: { sub: string }) {
    return this.tournamentsProxy.listAssignedMatchesForVenueOwner(user.sub);
  }
}
