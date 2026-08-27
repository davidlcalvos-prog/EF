import type {
  ReservationRow,
  ReservationSource,
  ReservationStatus,
} from '@/lib/dal/admin/types'

/**
 * Helper puro de formato, separado de reservations.ts para que los client
 * components puedan importarlo sin arrastrar next/headers (server-client).
 */

/**
 * Nombre a mostrar. Prioriza según `source`: para reservas telefónicas el
 * dato relevante es el cliente que llamó (customer_name), no el usuario
 * técnico que quedó asociado en el backend; para reservas de la app, el
 * jugador que reservó. Cae al otro campo si el preferido viene vacío.
 */
export function reservationDisplayName(
  row: Pick<ReservationRow, 'user_name' | 'customer_name' | 'source'>,
) {
  const preferCustomer = row.source === 'phone' || row.source === 'block'
  const primary = preferCustomer ? row.customer_name : row.user_name
  const secondary = preferCustomer ? row.user_name : row.customer_name
  return primary?.trim() || secondary?.trim() || 'Sin nombre'
}

export function formatReservationSchedule(startsAt: string, endsAt: string) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const date = start.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const startTime = start.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const endTime = end.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date} · ${startTime} – ${endTime}`
}

const statusLabels: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
}

export function getReservationStatusLabel(status: ReservationStatus) {
  return statusLabels[status]
}

const sourceLabels: Record<ReservationSource, string> = {
  app: 'App',
  phone: 'Teléfono',
  tournament: 'Torneo',
  block: 'Bloqueo',
}

export function getReservationSourceLabel(source: ReservationSource) {
  return sourceLabels[source]
}
