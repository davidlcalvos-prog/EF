import { apiFetchAuth } from '@/lib/api/server-client'
import type { ReservationRow, ReservationStatus } from '@/lib/dal/admin/types'

interface ReservationApiDto {
  id: string
  userId: string
  venueId: string | null
  venueName: string
  startsAt: string
  endsAt: string
  status: ReservationStatus
  notes: string | null
  createdAt: string
}

function toReservationRow(dto: ReservationApiDto): ReservationRow {
  return {
    id: dto.id,
    user_id: dto.userId,
    venue_id: dto.venueId,
    venue_name: dto.venueName,
    starts_at: dto.startsAt,
    ends_at: dto.endsAt,
    status: dto.status,
    notes: dto.notes,
    created_at: dto.createdAt,
  }
}

export async function listReservationsForVenueOwner(
  _ownerId: string,
): Promise<ReservationRow[]> {
  const rows = await apiFetchAuth<ReservationApiDto[]>('reservations/mine')
  return rows.map(toReservationRow)
}

export async function updateReservationStatusAsOwner(
  _ownerId: string,
  reservationId: string,
  status: ReservationStatus,
): Promise<void> {
  await apiFetchAuth(`reservations/${reservationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export { formatReservationSchedule } from './reservation-format'

const statusLabels: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
}

export function getReservationStatusLabel(status: ReservationStatus) {
  return statusLabels[status]
}
