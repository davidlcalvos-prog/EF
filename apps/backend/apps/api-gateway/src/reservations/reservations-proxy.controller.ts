import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthTokenPayload, CreateReservationDto } from '@ef/contracts';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReservationsProxyService } from './reservations-proxy.service';

/**
 * Lado jugador: buscar cancha y reservar. Separado de VenuesProxyController
 * (que exige rol Empresario/Administrador) porque aquí cualquier usuario
 * autenticado puede operar — sin RolesGuard.
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class ReservationsProxyController {
  constructor(private readonly reservationsProxy: ReservationsProxyService) {}

  @Get('venues')
  listVenues() {
    return this.reservationsProxy.listPublicVenues();
  }

  @Post('my-reservations')
  create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.reservationsProxy.createReservation(user.sub, dto);
  }

  @Get('my-reservations')
  listMine(@CurrentUser() user: AuthTokenPayload) {
    return this.reservationsProxy.listMine(user.sub);
  }

  @Get('my-reservations/:id')
  getMine(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.reservationsProxy.getMine(id, user.sub);
  }

  @Patch('my-reservations/:id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    return this.reservationsProxy.cancel(id, user.sub);
  }
}
