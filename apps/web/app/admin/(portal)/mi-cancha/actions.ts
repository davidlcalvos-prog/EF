'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin/session'
import {
  createCourt,
  deactivateCourt,
  searchMunicipalitiesApi,
  updateCourt,
  upsertMyVenue,
  type MunicipalityDto,
} from '@/lib/dal/admin/venues'
import type { CourtSize, VenueAmenity, VenueSurfaceType } from '@/lib/dal/admin/types'

const AMENITY_VALUES: VenueAmenity[] = ['cafeteria', 'transfers', 'bathroom']

export async function saveVenue(formData: FormData) {
  const session = await requireAdminSession()
  const id = String(formData.get('id') || '').trim() || undefined
  const name = String(formData.get('name') || '').trim()
  const address = String(formData.get('address') || '').trim()
  const price = Number(formData.get('price_per_hour') || 0)
  const surfaceType = String(formData.get('surface_type') || '').trim()
  // Ubicación (Fase L.0): municipio + pin opcional (solo si el dueño lo movió).
  const municipalityCode = String(formData.get('municipality_code') || '').trim()
  const latitudeRaw = String(formData.get('latitude') || '').trim()
  const longitudeRaw = String(formData.get('longitude') || '').trim()
  const latitude = latitudeRaw ? Number(latitudeRaw) : undefined
  const longitude = longitudeRaw ? Number(longitudeRaw) : undefined
  // Servicios: checkboxes con name="amenities" — solo llegan los marcados.
  const amenities = formData
    .getAll('amenities')
    .map(String)
    .filter((v): v is VenueAmenity => (AMENITY_VALUES as string[]).includes(v))

  if (!name) {
    throw new Error('El nombre de la cancha es obligatorio')
  }

  const venue = await upsertMyVenue(session.user.id, {
    id,
    name,
    address: address || null,
    price_per_hour_cents: Math.round(price * 100),
    surface_type: (surfaceType || null) as
      | 'natural_grass'
      | 'synthetic_grass'
      | 'dirt_gravel'
      | 'futsal_concrete'
      | null,
    amenities,
    ...(municipalityCode ? { municipality_code: municipalityCode } : {}),
    ...(municipalityCode &&
    latitude !== undefined &&
    longitude !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
      ? { latitude, longitude }
      : {}),
  })

  revalidatePath('/admin/mi-cancha')
  revalidatePath('/admin')
  return venue
}

/** Autocompletar de municipios para el formulario (server action, usa la sesión). */
export async function searchMunicipalities(q: string): Promise<MunicipalityDto[]> {
  await requireAdminSession()
  if (q.trim().length < 2) return []
  return searchMunicipalitiesApi(q.trim())
}

// ── Canchas (Fase W.1) ────────────────────────────────────────────────────

export async function addCourt(
  venueId: string,
  payload: {
    name: string
    size: CourtSize
    surface_type?: VenueSurfaceType | null
    price_per_hour_cents: number
  },
) {
  await requireAdminSession()
  const court = await createCourt(venueId, payload)
  revalidatePath('/admin/mi-cancha')
  revalidatePath('/admin')
  revalidatePath('/admin/reservas')
  return court
}

export async function editCourt(
  venueId: string,
  courtId: string,
  payload: {
    name?: string
    size?: CourtSize
    surface_type?: VenueSurfaceType | null
    price_per_hour_cents?: number
    is_active?: boolean
  },
) {
  await requireAdminSession()
  const court = await updateCourt(venueId, courtId, payload)
  revalidatePath('/admin/mi-cancha')
  revalidatePath('/admin')
  revalidatePath('/admin/reservas')
  return court
}

/** Desactiva (nunca borra); el gateway responde 409 si tiene reservas futuras. */
export async function removeCourt(venueId: string, courtId: string) {
  await requireAdminSession()
  const court = await deactivateCourt(venueId, courtId)
  revalidatePath('/admin/mi-cancha')
  revalidatePath('/admin')
  revalidatePath('/admin/reservas')
  return court
}
