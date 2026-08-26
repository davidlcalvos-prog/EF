import { Prisma } from '@prisma/client';

/**
 * Expresión SQL de Haversine (Fase L.0) que evalúa a la distancia en km entre
 * (lat, lng) y las columnas "latitude"/"longitude" de la fila — mismo cálculo
 * que haversineKm de @ef/common, pero como fragmento SQL para usar dentro de
 * un SELECT (proyectarla como columna) o un WHERE. A esta escala no hace
 * falta PostGIS; los índices @@index([latitude, longitude]) alcanzan.
 *
 * Usar `withAlias` para dar nombre a las columnas cuando el query tiene más
 * de una tabla con lat/lng (p. ej. "m"."latitude" en vez de "latitude").
 */
export function distanceKmExpr(
  lat: number,
  lng: number,
  columnPrefix = '',
): Prisma.Sql {
  const latCol = Prisma.raw(`${columnPrefix}"latitude"`);
  const lngCol = Prisma.raw(`${columnPrefix}"longitude"`);
  // 6371 = radio terrestre en km.
  return Prisma.sql`(
    2 * 6371 * asin(sqrt(
      pow(sin(radians((${latCol} - ${lat}) / 2)), 2) +
      cos(radians(${lat})) * cos(radians(${latCol})) *
      pow(sin(radians((${lngCol} - ${lng}) / 2)), 2)
    ))
  )`;
}

/**
 * Fragmento SQL para filtrar filas con columnas "latitude"/"longitude"
 * dentro de un radio fijo en km (p. ej. `WHERE ... AND ${whereWithinKm(...)}`).
 * Para radios que varían por fila (columna, no literal) usar `distanceKmExpr`
 * directamente y comparar contra esa columna en el WHERE.
 */
export function whereWithinKm(
  lat: number,
  lng: number,
  km: number,
): Prisma.Sql {
  return Prisma.sql`${distanceKmExpr(lat, lng)} <= ${km}`;
}
