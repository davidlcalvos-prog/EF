'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin/session'
import {
  createPhoneReservationAsOwner,
  updateReservationStatusAsOwner,
} from '@/lib/dal/admin/reservations'
import type { SettableReservationStatus } from '@/lib/dal/admin/types'

function revalidateReservationPaths() {
  revalidatePath('/admin/reservas')
  revalidatePath('/admin')
  revalidatePath('/admin/analiticas')
}

export async function setReservationStatus(
  reservationId: string,
  status: SettableReservationStatus,
) {
  const session = await requireAdminSession()
  const reservation = await updateReservationStatusAsOwner(
    session.user.id,
    reservationId,
    status,
  )
  revalidateReservationPaths()
  return reservation
}

export async function confirmReservation(reservationId: string) {
  return setReservationStatus(reservationId, 'confirmed')
}

export async function cancelReservation(reservationId: string) {
  return setReservationStatus(reservationId, 'cancelled')
}

export async function createPhoneReservation(payload: {
  court_id: string
  starts_at: string
  ends_at: string
  customer_name: string
  customer_phone?: string
  notes?: string
}) {
  const session = await requireAdminSession()
  const reservation = await createPhoneReservationAsOwner(
    session.user.id,
    payload,
  )
  revalidateReservationPaths()
  return reservation
}
