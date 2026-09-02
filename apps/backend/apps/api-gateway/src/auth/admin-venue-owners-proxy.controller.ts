import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SYSTEM_ROLE_NAMES } from '@ef/common';
import { CreateVenueOwnerDto, SetVenueOwnerStatusDto } from '@ef/contracts';
import { Roles } from './decorators';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthProxyService } from './auth-proxy.service';

/**
 * Fase W.3 — alta y gestión de dueños de cancha (Empresario), EXCLUSIVO de
 * Administrador (mismo patrón que TournamentsEliteForgeProxyController).
 * Los dueños no se registran solos: el registro público rechaza ese rol;
 * David los da de alta desde el portal. Un Empresario o Jugador recibe 403.
 */
@Controller('admin/venue-owners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLE_NAMES.ADMINISTRADOR)
export class AdminVenueOwnersProxyController {
  constructor(private readonly authProxy: AuthProxyService) {}

  @Post()
  create(@Body() dto: CreateVenueOwnerDto) {
    return this.authProxy.createVenueOwner(dto);
  }

  @Get()
  list() {
    return this.authProxy.listVenueOwners();
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: SetVenueOwnerStatusDto) {
    return this.authProxy.setVenueOwnerStatus(id, dto.estado);
  }
}
