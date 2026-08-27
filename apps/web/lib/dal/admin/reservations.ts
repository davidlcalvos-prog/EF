import { apiFetchAuth } from '@/lib/api/server-client'
import type {
  ReservationRow,
  ReservationSource,
  ReservationStatus,
  SettableReservationStatus,
} from '@/lib/dal/admin/types'

interface ReservationApiDto {
  id: string
  userId: string
  userName: string | null
  venueId: string | null
  venueName: string
  courtId: string | null
  courtName: string | null
  startsAt: string
  endsAt: string
  status: ReservationStatus
  source: ReservationSource
  customerName: string | null
  customerPhone: string | null
  notes: string | null
  createdAt: string
}

function toReservationRow(dto: ReservationApiDto): ReservationRow {
  return {
    id: dto.id,
    user_id: dto.userId,
    user_name: dto.userName,
    venue_id: dto.venueId,
    venue_name: dto.venueName,
    court_id: dto.courtId,
    court_name: dto.courtName,
    starts_at: dto.startsAt,
    ends_at: dto.endsAt,
    status: dto.status,
    source: dto.source,
    customer_name: dto.customerName,
    customer_phone: dto.customerPhone,
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
  status: SettableReservationStatus,
): Promise<ReservationRow> {
  const row = await apiFetchAuth<ReservationApiDto>(
    `reservations/${reservationId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  )
  return toReservationRow(row)
}

/** Owner reasigna una reserva app a otra cancha activa del mismo tamaño. */
export async function reassignReservationCourtAsOwner(
  _ownerId: string,
  reservationId: string,
  courtId: string,
): Promise<ReservationRow> {
  const row = await apiFetchAuth<ReservationApiDto>(
    `venues/reservations/${reservationId}/court`,
    {
      method: 'PATCH',
      body: JSON.stringify({ courtId }),
    },
  )
  return toReservationRow(row)
}

/** Owner crea una reserva telefónica — nace confirmed, source=phone. */
export async function createPhoneReservationAsOwner(
  _ownerId: string,
  payload: {
    court_id: string
    starts_at: string
    ends_at: string
    customer_name: string
    customer_phone?: string
    notes?: string
  },
): Promise<ReservationRow> {
  const row = await apiFetchAuth<ReservationApiDto>('venues/reservations/phone', {
    method: 'POST',
    body: JSON.stringify({
      courtId: payload.court_id,
      startsAt: payload.starts_at,
      endsAt: payload.ends_at,
      customerName: payload.customer_name,
      ...(payload.customer_phone ? { customerPhone: payload.customer_phone } : {}),
      ...(payload.notes ? { notes: payload.notes } : {}),
    }),
  })
  return toReservationRow(row)
}

export {
  formatReservationSchedule,
  getReservationSourceLabel,
  getReservationStatusLabel,
  reservationDisplayName,
} from './reservation-format'
