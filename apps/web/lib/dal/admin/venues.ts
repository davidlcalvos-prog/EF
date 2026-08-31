import { apiFetchAuth } from '@/lib/api/server-client'
import type {
  CourtRow,
  CourtSize,
  VenueAmenity,
  VenueRow,
  VenueSurfaceType,
} from '@/lib/dal/admin/types'

interface CourtApiDto {
  id: string
  name: string
  size: CourtSize
  surfaceType: VenueSurfaceType | null
  pricePerHourCents: number
  isActive: boolean
}

interface VenueApiDto {
  id: string
  ownerId: string
  name: string
  address: string | null
  pricePerHourCents: number
  availability: Record<string, unknown>
  surfaceType: VenueSurfaceType | null
  courts: CourtApiDto[]
  amenities: VenueAmenity[]
  municipalityCode: string | null
  city: string | null
  department: string | null
  latitude: number | null
  longitude: number | null
  locationSource: 'municipality' | 'pin' | null
  createdAt: string
  updatedAt: string
}

function toCourtRow(dto: CourtApiDto): CourtRow {
  return {
    id: dto.id,
    name: dto.name,
    size: dto.size,
    surface_type: dto.surfaceType,
    price_per_hour_cents: dto.pricePerHourCents,
    is_active: dto.isActive,
  }
}

function toVenueRow(dto: VenueApiDto): VenueRow {
  return {
    id: dto.id,
    owner_id: dto.ownerId,
    name: dto.name,
    address: dto.address,
    price_per_hour_cents: dto.pricePerHourCents,
    availability: dto.availability,
    surface_type: dto.surfaceType,
    courts: (dto.courts ?? []).map(toCourtRow),
    amenities: dto.amenities ?? [],
    municipality_code: dto.municipalityCode,
    city: dto.city,
    department: dto.department,
    latitude: dto.latitude,
    longitude: dto.longitude,
    location_source: dto.locationSource,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  }
}

export async function listMyVenues(_ownerId: string): Promise<VenueRow[]> {
  const rows = await apiFetchAuth<VenueApiDto[]>('venues/mine')
  return rows.map(toVenueRow)
}

export async function getMyPrimaryVenue(
  ownerId: string,
): Promise<VenueRow | null> {
  const venues = await listMyVenues(ownerId)
  return venues[0] ?? null
}

export async function upsertMyVenue(
  _ownerId: string,
  payload: {
    id?: string
    name: string
    address?: string | null
    price_per_hour_cents?: number
    surface_type?: VenueSurfaceType | null
    amenities?: VenueAmenity[]
    municipality_code?: string | null
    latitude?: number
    longitude?: number
  },
): Promise<VenueRow> {
  const row = await apiFetchAuth<VenueApiDto>('venues/mine', {
    method: 'PUT',
    body: JSON.stringify({
      id: payload.id,
      name: payload.name,
      address: payload.address,
      pricePerHourCents: payload.price_per_hour_cents,
      surfaceType: payload.surface_type || undefined,
      ...(payload.amenities !== undefined ? { amenities: payload.amenities } : {}),
      ...(payload.municipality_code !== undefined
        ? { municipalityCode: payload.municipality_code }
        : {}),
      ...(payload.latitude !== undefined && payload.longitude !== undefined
        ? { latitude: payload.latitude, longitude: payload.longitude }
        : {}),
    }),
  })
  return toVenueRow(row)
}

/**
 * Canchas de un complejo (Fase W.1). No hay GET dedicado — se reutiliza
 * `venues/mine` (única fuente de la lista embebida `courts`) y se filtra.
 */
export async function listCourts(venueId: string): Promise<CourtRow[]> {
  const venues = await apiFetchAuth<VenueApiDto[]>('venues/mine')
  const venue = venues.find((v) => v.id === venueId)
  return (venue?.courts ?? []).map(toCourtRow)
}

export async function createCourt(
  venueId: string,
  payload: {
    name: string
    size: CourtSize
    surface_type?: VenueSurfaceType | null
    price_per_hour_cents: number
    is_active?: boolean
  },
): Promise<CourtRow> {
  const row = await apiFetchAuth<CourtApiDto>(`venues/${venueId}/courts`, {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      size: payload.size,
      ...(payload.surface_type ? { surfaceType: payload.surface_type } : {}),
      pricePerHourCents: payload.price_per_hour_cents,
      ...(payload.is_active !== undefined ? { isActive: payload.is_active } : {}),
    }),
  })
  return toCourtRow(row)
}

export async function updateCourt(
  venueId: string,
  courtId: string,
  payload: {
    name?: string
    size?: CourtSize
    surface_type?: VenueSurfaceType | null
    price_per_hour_cents?: number
    is_active?: boolean
  },
): Promise<CourtRow> {
  const row = await apiFetchAuth<CourtApiDto>(
    `venues/${venueId}/courts/${courtId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.size !== undefined ? { size: payload.size } : {}),
        ...(payload.surface_type !== undefined
          ? { surfaceType: payload.surface_type }
          : {}),
        ...(payload.price_per_hour_cents !== undefined
          ? { pricePerHourCents: payload.price_per_hour_cents }
          : {}),
        ...(payload.is_active !== undefined ? { isActive: payload.is_active } : {}),
      }),
    },
  )
  return toCourtRow(row)
}

/** Desactiva (nunca borra) — el gateway responde 409 si tiene reservas futuras. */
export async function deactivateCourt(
  venueId: string,
  courtId: string,
): Promise<CourtRow> {
  const row = await apiFetchAuth<CourtApiDto>(
    `venues/${venueId}/courts/${courtId}`,
    { method: 'DELETE' },
  )
  return toCourtRow(row)
}

/** Autocompletar de municipios (Fase L.0) — dato estático del gateway. */
export interface MunicipalityDto {
  code: string
  name: string
  department: string
  lat: number
  lng: number
}

export async function searchMunicipalitiesApi(q: string): Promise<MunicipalityDto[]> {
  return apiFetchAuth<MunicipalityDto[]>(
    `geo/municipalities?q=${encodeURIComponent(q)}&limit=10`,
  )
}
