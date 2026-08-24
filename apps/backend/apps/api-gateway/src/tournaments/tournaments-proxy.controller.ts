import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { SYSTEM_ROLE_NAMES } from '@ef/common';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  UpdateTournamentMatchResultDto,
  UpsertTournamentTeamsDto,
} from '@ef/contracts';
import { CurrentUser, Roles } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TournamentsProxyService } from './tournaments-proxy.service';

/**
 * Torneos privados (Fase 7.1) — herramienta de uso personal del dueño de
 * cancha. El ownerId nunca se recibe del cliente: siempre user.sub del JWT.
 */
@Controller('tournaments/mine')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLE_NAMES.EMPRESARIO, SYSTEM_ROLE_NAMES.ADMINISTRADOR)
export class TournamentsProxyController {
  constructor(private readonly tournamentsProxy: TournamentsProxyService) {}

  @Get()
  listMine(@CurrentUser() user: { sub: string }) {
    return this.tournamentsProxy.listMine(user.sub);
  }

  @Get(':id')
  getMine(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.tournamentsProxy.getMine(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateTournamentDto) {
    return this.tournamentsProxy.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateTournamentDto,
  ) {
    return this.tournamentsProxy.update(user.sub, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.tournamentsProxy.delete(user.sub, id);
  }

  @Put(':id/teams')
  upsertTeams(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpsertTournamentTeamsDto,
  ) {
    return this.tournamentsProxy.upsertTeams(user.sub, id, dto);
  }

  @Post(':id/generate-fixture')
  generateFixture(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.tournamentsProxy.generateFixture(user.sub, id);
  }

  @Post(':id/extra-round')
  addExtraRound(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.tournamentsProxy.addExtraRound(user.sub, id);
  }

  @Patch(':id/matches/:matchId')
  updateMatchResult(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateTournamentMatchResultDto,
  ) {
    return this.tournamentsProxy.updateMatchResult(user.sub, id, matchId, dto);
  }
}
