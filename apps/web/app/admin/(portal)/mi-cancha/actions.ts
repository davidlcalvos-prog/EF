'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin/session'
import {
  searchMunicipalitiesApi,
  upsertMyVenue,
  type MunicipalityDto,
} from '@/lib/dal/admin/venues'

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

  if (!name) {
    throw new Error('El nombre de la cancha es obligatorio')
  }

  await upsertMyVenue(session.user.id, {
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
}

/** Autocompletar de municipios para el formulario (server action, usa la sesión). */
export async function searchMunicipalities(q: string): Promise<MunicipalityDto[]> {
  await requireAdminSession()
  if (q.trim().length < 2) return []
  return searchMunicipalitiesApi(q.trim())
}
