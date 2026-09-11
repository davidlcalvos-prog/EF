import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SYSTEM_ROLE_NAMES } from '@ef/common';
import { AdminUpdateUserEmailDto } from '@ef/contracts';
import { Roles } from './decorators';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthProxyService } from './auth-proxy.service';

/**
 * Corrección de datos de cuenta por un Administrador (2026-09-11). Hoy solo
 * el correo: hay usuarios registrados con correos mal escritos que no pueden
 * recuperar su contraseña ni corregirlo ellos mismos; antes se hacía por SSH +
 * SQL. Mismo patrón de guard que AdminVenueOwnersProxyController.
 */
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLE_NAMES.ADMINISTRADOR)
export class AdminUsersProxyController {
  constructor(private readonly authProxy: AuthProxyService) {}

  /** `GET /admin/users?email=…` → { id, email, name, role } o 404. Paso previo al PATCH de abajo. */
  @Get()
  findByEmail(@Query('email') email?: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('email query param is required');
    }
    return this.authProxy.findUserByEmail(email);
  }

  /** 400 formato inválido (DTO), 404 usuario inexistente, 409 correo ya registrado. */
  @Patch(':id/email')
  updateEmail(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminUpdateUserEmailDto) {
    return this.authProxy.updateUserEmail(id, dto);
  }
}
