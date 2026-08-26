import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { searchMunicipalities } from '@ef/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

/**
 * Datos geográficos estáticos (Fase L.0). Se sirven directamente desde el
 * gateway — no hay microservicio detrás porque el dato vive en libs/common.
 */
@Controller('geo')
@UseGuards(JwtAuthGuard)
export class GeoController {
  @Get('municipalities')
  municipalities(@Query('q') q?: string, @Query('limit') limit?: string) {
    const parsed = Number(limit);
    const resolved = Number.isFinite(parsed)
      ? Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT)
      : DEFAULT_LIMIT;
    return searchMunicipalities(q ?? '', resolved);
  }
}
