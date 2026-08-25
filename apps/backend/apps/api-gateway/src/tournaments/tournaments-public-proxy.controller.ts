import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { EnrollGroupDto } from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TournamentsProxyService } from './tournaments-proxy.service';

/**
 * Copa Elite Forge (Fase 7.2) — lado jugador. Solo JwtAuthGuard (sin
 * RolesGuard): cualquier usuario autenticado puede ver torneos activos y su
 * detalle público, o inscribir un grupo si es su creator/admin (validado
 * server-side en el service, no por rol).
 */
@Controller('tournaments')
@UseGuards(JwtAuthGuard)
export class TournamentsPublicProxyController {
  constructor(private readonly tournamentsProxy: TournamentsProxyService) {}

  @Get('active')
  listActive() {
    return this.tournamentsProxy.listActiveForPlayer();
  }

  @Get(':id/public')
  getPublic(@Param('id') id: string) {
    return this.tournamentsProxy.getPublic(id);
  }

  /** Rankings del campeonato (goleadores + valla) — solo datos de ESTE torneo. */
  @Get(':id/rankings')
  getRankings(@Param('id') id: string) {
    return this.tournamentsProxy.getRankings(id);
  }

  @Post(':id/enroll')
  enroll(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: EnrollGroupDto,
  ) {
    return this.tournamentsProxy.enrollGroup(user.sub, id, dto);
  }
}
