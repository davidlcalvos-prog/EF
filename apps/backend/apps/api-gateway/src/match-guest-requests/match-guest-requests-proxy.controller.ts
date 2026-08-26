import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthTokenPayload, OpenGuestRequestDto } from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MatchGuestRequestsProxyService } from './match-guest-requests-proxy.service';

/**
 * Comodín (Fase 11): rutas mezcladas bajo /matches/:matchId/guest-requests
 * (abrir/consultar/cancelar la vacante de un partido puntual) y bajo
 * /guest-requests/... (listado "cerca de mí" + ciclo de postulaciones) —
 * mismo criterio que GroupFriendshipsProxyController.
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class MatchGuestRequestsProxyController {
  constructor(private readonly guestRequestsProxy: MatchGuestRequestsProxyService) {}

  @Post('matches/:matchId/guest-requests')
  open(
    @Param('matchId') matchId: string,
    @Body() dto: OpenGuestRequestDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.guestRequestsProxy.open(matchId, user.sub, dto);
  }

  @Delete('matches/:matchId/guest-requests/current')
  cancel(@Param('matchId') matchId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.guestRequestsProxy.cancel(matchId, user.sub);
  }

  @Get('matches/:matchId/guest-requests/current')
  getForMatch(@Param('matchId') matchId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.guestRequestsProxy.getForMatch(matchId, user.sub);
  }

  @Get('guest-requests/nearby')
  listNearby(@CurrentUser() user: AuthTokenPayload) {
    return this.guestRequestsProxy.listNearby(user.sub);
  }

  @Post('guest-requests/:id/applications')
  apply(@Param('id') requestId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.guestRequestsProxy.apply(requestId, user.sub);
  }

  @Get('guest-requests/:id/applications')
  listApplications(@Param('id') requestId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.guestRequestsProxy.listApplications(requestId, user.sub);
  }

  @Delete('guest-requests/applications/:id')
  withdraw(@Param('id') applicationId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.guestRequestsProxy.withdraw(applicationId, user.sub);
  }

  @Post('guest-requests/applications/:id/accept')
  accept(@Param('id') applicationId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.guestRequestsProxy.accept(applicationId, user.sub);
  }

  @Post('guest-requests/applications/:id/reject')
  reject(@Param('id') applicationId: string, @CurrentUser() user: AuthTokenPayload) {
    return this.guestRequestsProxy.reject(applicationId, user.sub);
  }
}
