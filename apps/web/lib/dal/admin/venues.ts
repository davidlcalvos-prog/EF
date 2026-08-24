import { apiFetchAuth } from '@/lib/api/server-client'
import type { VenueRow, VenueSurfaceType } from '@/lib/dal/admin/types'

interface VenueApiDto {
  id: string
  ownerId: string
  name: string
  address: string | null
  pricePerHourCents: number
  availability: Record<string, unknown>
  surfaceType: VenueSurfaceType | null
  createdAt: string
  updatedAt: string
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
    }),
  })
  return toVenueRow(row)
}
