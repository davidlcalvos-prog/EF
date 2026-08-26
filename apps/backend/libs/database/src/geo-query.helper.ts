import { Prisma } from '@prisma/client';

/**
 * Fragmento SQL de Haversine (Fase L.0) para filtrar filas con columnas
 * "latitude"/"longitude" dentro de un radio en km. Pensado para usarse en
 * las fases siguientes (comodín, Retos, canchas por zona) con
 * prisma.$queryRaw — a esta escala no hace falta PostGIS; los índices
 * @@index([latitude, longitude]) de Venue/Match alcanzan.
 *
 * Uso:
 *   const rows = await prisma.$queryRaw`
 *     SELECT id FROM venues
 *     WHERE latitude IS NOT NULL AND ${whereWithinKm(lat, lng, 20)}
 *   `;
 */
export function whereWithinKm(
  lat: number,
  lng: number,
  km: number,
): Prisma.Sql {
  // 6371 = radio terrestre en km. Mismo cálculo que haversineKm de @ef/common.
  return Prisma.sql`(
    2 * 6371 * asin(sqrt(
      pow(sin(radians(("latitude" - ${lat}) / 2)), 2) +
      cos(radians(${lat})) * cos(radians("latitude")) *
      pow(sin(radians(("longitude" - ${lng}) / 2)), 2)
    ))
  ) <= ${km}`;
}
