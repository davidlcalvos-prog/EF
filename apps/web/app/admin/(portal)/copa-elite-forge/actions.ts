'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin/session'
import { updateReservationStatusAsOwner } from '@/lib/dal/admin/reservations'

/**
 * Reusa exactamente el mismo mecanismo que ya cancela una reserva desde
 * /admin/reservas (updateReservationStatusAsOwner) — no hay endpoint nuevo.
 * No hay reasignación automática de cancha en esta fase: el partido queda
 * sin cancha hasta que el Administrador lo note y regenere esa parte del
 * fixture manualmente.
 */
export async function releaseAssignedMatch(reservationId: string) {
  const session = await requireAdminSession()
  await updateReservationStatusAsOwner(session.user.id, reservationId, 'cancelled')
  revalidatePath('/admin/copa-elite-forge')
  revalidatePath('/admin/reservas')
}
