/**
 * Dueños de cancha (Fase W.3) — server-only (apiFetchAuth depende de
 * next/headers). Solo lo importan page.tsx y actions.ts; el backend restringe
 * las tres rutas a Administrador (403 para cualquier otro rol).
 */
import { apiFetchAuth } from '@/lib/api/server-client'

export interface VenueOwner {
  id: string
  email: string
  name: string
  estado: boolean
  createdAt: string
  venueName: string | null
}

export async function listVenueOwners(): Promise<VenueOwner[]> {
  return apiFetchAuth<VenueOwner[]>('admin/venue-owners')
}

export async function createVenueOwner(payload: {
  email: string
  name: string
  password: string
}): Promise<VenueOwner> {
  return apiFetchAuth<VenueOwner>('admin/venue-owners', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function setVenueOwnerStatus(
  id: string,
  estado: boolean,
): Promise<VenueOwner> {
  return apiFetchAuth<VenueOwner>(`admin/venue-owners/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}
