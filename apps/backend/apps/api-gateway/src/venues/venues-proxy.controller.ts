import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SYSTEM_ROLE_NAMES } from '@ef/common';
import {
  CreateCourtDto,
  CreatePhoneReservationDto,
  UpdateCourtDto,
  UpdateReservationStatusDto,
  UpsertVenueDto,
} from '@ef/contracts';
import { CurrentUser, Roles } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { VenuesProxyService } from './venues-proxy.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLE_NAMES.EMPRESARIO, SYSTEM_ROLE_NAMES.ADMINISTRADOR)
export class VenuesProxyController {
  constructor(private readonly venuesProxy: VenuesProxyService) {}

  @Get('venues/mine')
  listMine(@CurrentUser() user: { sub: string }) {
    return this.venuesProxy.listMine(user.sub);
  }

  @Put('venues/mine')
  upsertMine(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpsertVenueDto,
  ) {
    return this.venuesProxy.upsertMine(user.sub, dto);
  }

  @Get('reservations/mine')
  listReservationsMine(@CurrentUser() user: { sub: string }) {
    return this.venuesProxy.listReservationsMine(user.sub);
  }

  @Patch('reservations/:id/status')
  updateReservationStatus(
    @CurrentUser() user: { sub: string },
    @Param('id') reservationId: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.venuesProxy.updateReservationStatus(
      user.sub,
      reservationId,
      dto,
    );
  }

  // --- Courts (Fase W.1) ---

  @Post('venues/:venueId/courts')
  createCourt(
    @CurrentUser() user: { sub: string },
    @Param('venueId') venueId: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.venuesProxy.createCourt(user.sub, venueId, dto);
  }

  @Patch('venues/:venueId/courts/:courtId')
  updateCourt(
    @CurrentUser() user: { sub: string },
    @Param('courtId') courtId: string,
    @Body() dto: UpdateCourtDto,
  ) {
    return this.venuesProxy.updateCourt(user.sub, courtId, dto);
  }

  /** "Borrar" del lado dueño = desactivar, nunca se borra la fila — ver A.3 del prompt de Fase W.1. */
  @Delete('venues/:venueId/courts/:courtId')
  deactivateCourt(
    @CurrentUser() user: { sub: string },
    @Param('courtId') courtId: string,
  ) {
    return this.venuesProxy.deactivateCourt(user.sub, courtId);
  }

  @Post('venues/reservations/phone')
  createPhoneReservation(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreatePhoneReservationDto,
  ) {
    return this.venuesProxy.createPhoneReservation(user.sub, dto);
  }
}
