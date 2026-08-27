import type { ReservationRow, ReservationSource } from '@/lib/dal/admin/types'
import {
  getReservationSourceLabel,
  reservationDisplayName,
} from '@/lib/dal/admin/reservation-format'

export type DayStat = {
  dayIndex: number
  dayLabel: string
  count: number
  topHours: Array<{ hour: number; label: string; count: number }>
}

export type HourStat = {
  hour: number
  label: string
  count: number
}

export type ClientStat = {
  name: string
  total: number
  confirmed: number
  pending: number
  cancelled: number
  cancelRate: number
  fulfillmentRate: number
}

export type SourceStat = {
  source: ReservationSource
  label: string
  count: number
}

const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

const SOURCES: ReservationSource[] = ['app', 'phone', 'tournament', 'block']

function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:00 ${suffix}`
}

/** Ocupación: pending + confirmed (excluye canceladas). */
function activeReservations(items: ReservationRow[]) {
  return items.filter((r) => r.status !== 'cancelled')
}

export function computeDayOccupancy(items: ReservationRow[]): {
  busiest: DayStat[]
  quietest: DayStat[]
  byDay: DayStat[]
} {
  const active = activeReservations(items)
  const dayMap = new Map<number, ReservationRow[]>()

  for (let i = 0; i < 7; i++) dayMap.set(i, [])

  for (const r of active) {
    const d = new Date(r.starts_at)
    const list = dayMap.get(d.getDay()) ?? []
    list.push(r)
    dayMap.set(d.getDay(), list)
  }

  const byDay: DayStat[] = Array.from({ length: 7 }, (_, dayIndex) => {
    const list = dayMap.get(dayIndex) ?? []
    const hourCounts = new Map<number, number>()
    for (const r of list) {
      const h = new Date(r.starts_at).getHours()
      hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1)
    }
    const topHours = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({
        hour,
        label: formatHourLabel(hour),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return {
      dayIndex,
      dayLabel: DAY_LABELS[dayIndex],
      count: list.length,
      topHours,
    }
  })

  const sortedBusy = [...byDay].sort((a, b) => b.count - a.count)
  const sortedQuiet = [...byDay].sort((a, b) => a.count - b.count)

  return {
    byDay,
    busiest: sortedBusy.slice(0, 3),
    quietest: sortedQuiet.slice(0, 3),
  }
}

export function computeHourOccupancy(items: ReservationRow[]): {
  busiestHours: HourStat[]
  quietestHours: HourStat[]
} {
  const active = activeReservations(items)
  const hourCounts = new Map<number, number>()
  for (let h = 8; h <= 22; h++) hourCounts.set(h, 0)

  for (const r of active) {
    const h = new Date(r.starts_at).getHours()
    if (h >= 8 && h <= 22) {
      hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1)
    }
  }

  const all: HourStat[] = Array.from(hourCounts.entries()).map(
    ([hour, count]) => ({
      hour,
      label: formatHourLabel(hour),
      count,
    }),
  )

  return {
    busiestHours: [...all].sort((a, b) => b.count - a.count).slice(0, 5),
    quietestHours: [...all].sort((a, b) => a.count - b.count).slice(0, 5),
  }
}

export function computeClientStats(items: ReservationRow[]): ClientStat[] {
  const byName = new Map<string, ReservationRow[]>()

  for (const r of items) {
    const key = reservationDisplayName(r)
    const list = byName.get(key) ?? []
    list.push(r)
    byName.set(key, list)
  }

  return Array.from(byName.entries())
    .map(([name, list]) => {
      const total = list.length
      const confirmed = list.filter((r) => r.status === 'confirmed').length
      const pending = list.filter((r) => r.status === 'pending').length
      const cancelled = list.filter((r) => r.status === 'cancelled').length
      const cancelRate = total === 0 ? 0 : cancelled / total
      const fulfillmentRate = total === 0 ? 0 : (confirmed + pending) / total
      return {
        name,
        total,
        confirmed,
        pending,
        cancelled,
        cancelRate,
        fulfillmentRate,
      }
    })
    .sort((a, b) => b.total - a.total)
}

export function computeSourceBreakdown(items: ReservationRow[]): SourceStat[] {
  const counts = new Map<ReservationSource, number>()
  for (const source of SOURCES) counts.set(source, 0)
  for (const r of items) counts.set(r.source, (counts.get(r.source) ?? 0) + 1)
  return SOURCES.map((source) => ({
    source,
    label: getReservationSourceLabel(source),
    count: counts.get(source) ?? 0,
  }))
}
