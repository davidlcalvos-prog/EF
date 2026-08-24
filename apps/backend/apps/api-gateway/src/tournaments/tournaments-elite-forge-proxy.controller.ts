import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SYSTEM_ROLE_NAMES } from '@ef/common';
import { CreateEliteForgeTournamentDto } from '@ef/contracts';
import { CurrentUser, Roles } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TournamentsProxyService } from './tournaments-proxy.service';

/**
 * Copa Elite Forge (Fase 7.2) — creacion y administracion, exclusivo de
 * Administrador. Reutiliza PATCH/DELETE /tournaments/mine/:id + el resto de
 * rutas ya existentes de la 7.1 para operar sobre estos torneos (mismo id,
 * el service ya distingue por kind y por ownerId via requireOwned).
 */
@Controller('tournaments/elite-forge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLE_NAMES.ADMINISTRADOR)
export class TournamentsEliteForgeProxyController {
  constructor(private readonly tournamentsProxy: TournamentsProxyService) {}

  @Get()
  listMine(@CurrentUser() user: { sub: string }) {
    return this.tournamentsProxy.listMine(user.sub);
  }

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateEliteForgeTournamentDto) {
    return this.tournamentsProxy.createEliteForge(user.sub, dto);
  }
}
