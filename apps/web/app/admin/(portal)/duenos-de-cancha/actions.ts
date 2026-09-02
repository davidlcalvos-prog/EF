'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin/session'
import {
  createVenueOwner,
  setVenueOwnerStatus,
  type VenueOwner,
} from '@/lib/dal/admin/venue-owners'

async function requireAdministrador() {
  const session = await requireAdminSession()
  if (session.role !== 'Administrador') {
    throw new Error('Solo el Administrador puede gestionar dueños de cancha.')
  }
}

export async function createVenueOwnerAction(payload: {
  email: string
  name: string
  password: string
}): Promise<VenueOwner> {
  await requireAdministrador()
  const owner = await createVenueOwner(payload)
  revalidatePath('/admin/duenos-de-cancha')
  return owner
}

export async function setVenueOwnerStatusAction(
  id: string,
  estado: boolean,
): Promise<VenueOwner> {
  await requireAdministrador()
  const owner = await setVenueOwnerStatus(id, estado)
  revalidatePath('/admin/duenos-de-cancha')
  return owner
}
