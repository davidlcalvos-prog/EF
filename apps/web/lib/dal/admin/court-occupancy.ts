import type { CourtRow, CourtSize, ReservationRow } from '@/lib/dal/admin/types'

export type SizeOccupancy = {
  size: CourtSize
  label: string
  capacity: number
  occupied: number
  free: number
  demand: number
}

export type LiveOccupancy = {
  nowLabel: string
  totalCapacity: number
  totalOccupied: number
  totalFree: number
  bySize: SizeOccupancy[]
}

const SIZE_LABELS: Record<CourtSize, string> = {
  five: '5 vs 5',
  six: '6 vs 6',
  seven: '7 vs 7',
  eight: '8 vs 8',
  eleven: '11 vs 11',
}

export function courtSizeLabel(size: CourtSize) {
  return SIZE_LABELS[size]
}

const SIZE_ORDER: CourtSize[] = ['five', 'six', 'seven', 'eight', 'eleven']

/** Reservas activas que cruzan el instante `now`. */
export function isReservationLiveNow(
  reservation: Pick<ReservationRow, 'status' | 'starts_at' | 'ends_at'>,
  now = new Date(),
) {
  if (reservation.status === 'cancelled') return false
  const start = new Date(reservation.starts_at).getTime()
  const end = new Date(reservation.ends_at).getTime()
  const t = now.getTime()
  return start <= t && t < end
}

/**
 * Ocupación en tiempo real agrupada por tamaño real de cancha (Fase W.1):
 * capacidad = canchas activas por tamaño, ocupadas = reservas no canceladas
 * cuyo rango [starts_at, ends_at) contiene `now`.
 */
export function computeLiveOccupancy(
  courts: CourtRow[],
  reservations: ReservationRow[],
  now = new Date(),
): LiveOccupancy {
  const activeCourts = courts.filter((c) => c.is_active)
  const courtSizeById = new Map(activeCourts.map((c) => [c.id, c.size]))
  const live = reservations.filter((r) => isReservationLiveNow(r, now))

  const sizesPresent = SIZE_ORDER.filter((size) =>
    activeCourts.some((c) => c.size === size),
  )
  const sizes = sizesPresent.length > 0 ? sizesPresent : SIZE_ORDER

  const bySize: SizeOccupancy[] = sizes.map((size) => {
    const capacity = activeCourts.filter((c) => c.size === size).length
    const demand = live.filter(
      (r) => r.court_id && courtSizeById.get(r.court_id) === size,
    ).length
    const occupied = Math.min(capacity, demand)
    return {
      size,
      label: courtSizeLabel(size),
      capacity,
      occupied,
      free: Math.max(0, capacity - occupied),
      demand,
    }
  })

  const totalCapacity = bySize.reduce((n, s) => n + s.capacity, 0)
  const totalOccupied = bySize.reduce((n, s) => n + s.occupied, 0)
  const totalFree = bySize.reduce((n, s) => n + s.free, 0)

  const nowLabel = now.toLocaleString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

  return {
    nowLabel,
    totalCapacity,
    totalOccupied,
    totalFree,
    bySize,
  }
}
