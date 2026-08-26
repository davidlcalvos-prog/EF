import { MUNICIPALITIES } from './municipalities.data';
import type { GeoPoint, Municipality } from './types';

export { MUNICIPALITIES };
export type { GeoPoint, Municipality };

const byCode = new Map<string, Municipality>(
  MUNICIPALITIES.map((m) => [m.code, m]),
);

export function findMunicipality(code: string): Municipality | undefined {
  return byCode.get(code);
}

/** Minúsculas y sin acentos, para comparar búsquedas. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Búsqueda por prefijo insensible a acentos/mayúsculas: primero coincidencias
 * en `name`, luego en `department`, alfabéticas dentro de cada bloque.
 */
export function searchMunicipalities(q: string, limit = 10): Municipality[] {
  const term = normalize(q.trim());
  if (!term) return [];

  const byName: Municipality[] = [];
  const byDepartment: Municipality[] = [];
  for (const m of MUNICIPALITIES) {
    if (normalize(m.name).startsWith(term)) {
      byName.push(m);
    } else if (normalize(m.department).startsWith(term)) {
      byDepartment.push(m);
    }
  }
  const sortAlpha = (a: Municipality, b: Municipality) =>
    a.name.localeCompare(b.name, 'es');
  byName.sort(sortAlpha);
  byDepartment.sort(sortAlpha);
  return [...byName, ...byDepartment].slice(0, limit);
}

const EARTH_RADIUS_KM = 6371;

/** Distancia de gran círculo entre dos puntos, en kilómetros. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
