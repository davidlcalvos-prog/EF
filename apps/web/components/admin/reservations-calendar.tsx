'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Phone,
  Plus,
  Repeat,
  Search,
  Smartphone,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CourtRow, ReservationRow, ReservationSource, ReservationStatus } from '@/lib/dal/admin/types'
import {
  cancelReservation,
  confirmReservation,
  createPhoneReservation,
  reassignReservationCourt,
} from '@/app/admin/(portal)/reservas/actions'
import {
  getReservationSourceLabel,
  reservationDisplayName,
} from '@/lib/dal/admin/reservation-format'
import { courtSizeLabel } from '@/lib/dal/admin/court-occupancy'
import { AddReservationModal, type PhoneReservationPayload } from '@/components/admin/add-reservation-modal'
import { ReassignCourtModal } from '@/components/admin/reassign-court-modal'
import { eliteForgeColors } from '@/lib/theme/elite-forge'

type CalendarView = 'day' | 'week' | 'month'

/** Horario operativo: 8 AM – 10 PM */
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8)
const DAY_MS = 24 * 60 * 60 * 1000
const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
]

const BRAND = {
  emerald: eliteForgeColors.emerald,
  orange: eliteForgeColors.orange,
  gray: eliteForgeColors.muted,
  grayBg: eliteForgeColors.carbonBorder,
  white: eliteForgeColors.white,
  onEmerald: eliteForgeColors.onEmerald,
  onOrange: eliteForgeColors.onOrange,
} as const

const SOURCE_ICON: Record<ReservationSource, LucideIcon> = {
  app: Smartphone,
  phone: Phone,
  tournament: Trophy,
  block: Ban,
}

function SourceBadge({ source }: { source: ReservationSource }) {
  const Icon = SOURCE_ICON[source]
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3 w-3" />
      {getReservationSourceLabel(source)}
    </span>
  )
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeekMonday(date: Date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function startOfWeekSunday(date: Date) {
  const d = startOfDay(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS)
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function statusLabel(status: ReservationStatus) {
  if (status === 'confirmed') return 'Confirmada'
  if (status === 'pending') return 'Pendiente'
  return 'Cancelada'
}

function statusChipStyle(status: ReservationStatus): CSSProperties {
  switch (status) {
    case 'confirmed':
      return {
        backgroundColor: BRAND.emerald,
        borderColor: BRAND.emerald,
        color: BRAND.onEmerald,
      }
    case 'cancelled':
      return {
        backgroundColor: BRAND.orange,
        borderColor: BRAND.orange,
        color: BRAND.onOrange,
      }
    case 'pending':
      return {
        backgroundColor: BRAND.grayBg,
        borderColor: BRAND.gray,
        color: BRAND.white,
      }
    default:
      return {
        backgroundColor: '#333',
        borderColor: '#555',
        color: BRAND.white,
      }
  }
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${suffix}`
}

function matchesQuery(r: ReservationRow, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [
    reservationDisplayName(r),
    r.venue_name,
    r.court_name,
    statusLabel(r.status),
    getReservationSourceLabel(r.source),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q)
}

function NamePill({
  event,
  onOpen,
}: {
  event: ReservationRow
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title={reservationDisplayName(event)}
      className="min-w-0 max-w-full truncate rounded-lg border-2 px-2.5 py-1.5 text-left text-xs font-bold shadow-sm transition hover:brightness-110 sm:text-sm"
      style={statusChipStyle(event.status)}
    >
      {reservationDisplayName(event)}
    </button>
  )
}

function ReservationModal({
  event,
  onClose,
  courts,
  allReservations,
}: {
  event: ReservationRow
  onClose: () => void
  courts: CourtRow[]
  allReservations: ReservationRow[]
}) {
  const start = new Date(event.starts_at)
  const end = new Date(event.ends_at)
  const canConfirm = event.status === 'pending'
  const canCancel = event.status === 'pending' || event.status === 'confirmed'
  const canReassign =
    event.source === 'app' &&
    (event.status === 'pending' || event.status === 'confirmed') &&
    !!event.court_id &&
    start > new Date()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reassignOpen, setReassignOpen] = useState(false)

  async function handleConfirm() {
    setPending(true)
    setError(null)
    try {
      await confirmReservation(event.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar.')
    } finally {
      setPending(false)
    }
  }

  async function handleCancel() {
    setPending(true)
    setError(null)
    try {
      await cancelReservation(event.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl ef-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Detalle de reserva
            </p>
            <h2
              id="reservation-modal-title"
              className="mt-1 font-heading text-2xl font-bold text-foreground"
            >
              {reservationDisplayName(event)}
            </h2>
            <div className="mt-2">
              <SourceBadge source={event.source} />
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Cancha</dt>
            <dd className="font-medium text-foreground">
              {event.court_name ?? event.venue_name}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Horario</dt>
            <dd className="text-foreground">
              {start.toLocaleString('es', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              –{' '}
              {end.toLocaleTimeString('es', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Estado</dt>
            <dd>
              <span
                className="mt-1 inline-flex rounded-full border-2 px-3 py-1 text-xs font-bold uppercase"
                style={statusChipStyle(event.status)}
              >
                {statusLabel(event.status)}
              </span>
            </dd>
          </div>
          {event.customer_phone && (
            <div>
              <dt className="text-xs text-muted-foreground">Teléfono</dt>
              <dd className="text-foreground">{event.customer_phone}</dd>
            </div>
          )}
          {event.notes && (
            <div>
              <dt className="text-xs text-muted-foreground">Notas</dt>
              <dd className="text-foreground">{event.notes}</dd>
            </div>
          )}
        </dl>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          {canConfirm && (
            <Button
              type="button"
              disabled={pending}
              onClick={handleConfirm}
              style={{ backgroundColor: BRAND.emerald, color: BRAND.onEmerald }}
            >
              Confirmar
            </Button>
          )}
          {canCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={handleCancel}
            >
              {event.status === 'pending' ? 'Rechazar' : 'Cancelar reserva'}
            </Button>
          )}
          {canReassign && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setReassignOpen(true)}
            >
              <Repeat className="mr-1.5 h-4 w-4" />
              Reasignar cancha
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>

      {canReassign && reassignOpen && (
        <ReassignCourtModal
          open={reassignOpen}
          onClose={() => setReassignOpen(false)}
          reservation={event}
          courts={courts}
          allReservations={allReservations}
          onReassign={async (courtId) => {
            await reassignReservationCourt(event.id, courtId)
          }}
        />
      )}
    </div>
  )
}

/** Timeline vertical del día seleccionado (también usada en Semana). */
function DayTimeline({
  day,
  eventsByHour,
  onOpen,
}: {
  day: Date
  eventsByHour: Map<string, ReservationRow[]>
  onOpen: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl ef-card">
      <div className="border-b border-border px-4 py-3">
        <p className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {day.toLocaleDateString('es', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        <p className="text-xs text-muted-foreground">8 AM – 10 PM</p>
      </div>

      <ul className="divide-y divide-border/70">
        {HOURS.map((hour) => {
          const key = `${day.toDateString()}-${hour}`
          const slot = eventsByHour.get(key) ?? []
          return (
            <li
              key={key}
              className="grid grid-cols-[3.5rem_1fr] gap-2 px-3 py-2.5 sm:grid-cols-[4.5rem_1fr] sm:gap-3 sm:px-4"
            >
              <div className="pt-1 text-right text-[11px] font-medium text-muted-foreground sm:text-xs">
                {formatHour(hour)}
              </div>
              <div className="min-w-0">
                {slot.length === 0 ? (
                  <div className="flex min-h-9 items-center rounded-lg border border-dashed border-border/40 px-2 text-[11px] text-muted-foreground/70">
                    Libre
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-5">
                    {slot.map((event) => (
                      <NamePill
                        key={event.id}
                        event={event}
                        onOpen={() => onOpen(event.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ReservationsCalendar({
  reservations,
  venueId,
  courts,
}: {
  reservations: ReservationRow[]
  venueId: string | null
  courts: CourtRow[]
}) {
  const [view, setView] = useState<CalendarView>('week')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [nameQuery, setNameQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [courtFilter, setCourtFilter] = useState<string>('all')
  const [addError, setAddError] = useState<string | null>(null)

  const courtFiltered = useMemo(
    () =>
      courtFilter === 'all'
        ? reservations
        : reservations.filter((r) => r.court_id === courtFilter),
    [reservations, courtFilter],
  )

  const filtered = useMemo(
    () => courtFiltered.filter((r) => matchesQuery(r, nameQuery)),
    [courtFiltered, nameQuery],
  )

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(anchor)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [anchor])

  const monthDays = useMemo(() => {
    const gridStart = startOfWeekSunday(startOfMonth(anchor))
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }, [anchor])

  const periodLabel = useMemo(() => {
    if (view === 'day') {
      return anchor.toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }
    if (view === 'week') {
      const start = weekDays[0]
      const end = weekDays[6]
      const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
      return `${start.toLocaleDateString('es', opts)} – ${end.toLocaleDateString('es', { ...opts, year: 'numeric' })}`
    }
    return anchor.toLocaleDateString('es', { month: 'long', year: 'numeric' })
  }, [view, anchor, weekDays])

  const rangeStartEnd = useMemo(() => {
    if (view === 'day') {
      const start = startOfDay(anchor)
      return { start, end: addDays(start, 1) }
    }
    if (view === 'week') {
      return { start: weekDays[0], end: addDays(weekDays[6], 1) }
    }
    return {
      start: startOfMonth(anchor),
      end: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1),
    }
  }, [view, anchor, weekDays])

  const inRange = useMemo(
    () =>
      filtered.filter((r) => {
        const start = new Date(r.starts_at)
        return start >= rangeStartEnd.start && start < rangeStartEnd.end
      }),
    [filtered, rangeStartEnd],
  )

  const eventsByDayHour = useMemo(() => {
    const map = new Map<string, ReservationRow[]>()
    for (const reservation of filtered) {
      const start = new Date(reservation.starts_at)
      const key = `${start.toDateString()}-${start.getHours()}`
      const list = map.get(key) ?? []
      list.push(reservation)
      map.set(key, list)
    }
    return map
  }, [filtered])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ReservationRow[]>()
    for (const reservation of filtered) {
      const start = new Date(reservation.starts_at)
      const key = start.toDateString()
      const list = map.get(key) ?? []
      list.push(reservation)
      map.set(key, list)
    }
    return map
  }, [filtered])

  const stats = useMemo(
    () => ({
      confirmed: inRange.filter((r) => r.status === 'confirmed').length,
      pending: inRange.filter((r) => r.status === 'pending').length,
      cancelled: inRange.filter((r) => r.status === 'cancelled').length,
    }),
    [inRange],
  )

  const selected = courtFiltered.find((r) => r.id === selectedId) ?? null

  function shiftPeriod(direction: -1 | 1) {
    if (view === 'day') setAnchor((d) => addDays(d, direction))
    else if (view === 'week') setAnchor((d) => addDays(d, direction * 7))
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1))
  }

  async function handleCreatePhoneReservation(payload: PhoneReservationPayload) {
    const reservation = await createPhoneReservation(payload)
    setAnchor(startOfDay(new Date(reservation.starts_at)))
    setView('day')
    setSelectedId(reservation.id)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex w-full rounded-xl ef-card p-1 sm:w-auto">
              {VIEWS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className="flex-1 rounded-lg px-3 py-2 font-heading text-xs font-semibold uppercase tracking-wide transition sm:flex-none"
                  style={
                    view === item.id
                      ? {
                          backgroundColor: `${BRAND.emerald}33`,
                          color: BRAND.emerald,
                        }
                      : undefined
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Periodo anterior"
                onClick={() => shiftPeriod(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Periodo siguiente"
                onClick={() => shiftPeriod(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-base font-semibold uppercase tracking-tight capitalize text-foreground sm:text-lg">
                {periodLabel}
              </p>
              <button
                type="button"
                className="text-xs hover:underline"
                style={{ color: BRAND.emerald }}
                onClick={() => setAnchor(startOfDay(new Date()))}
              >
                Ir a hoy
              </button>
            </div>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Buscar nombre, cancha…"
              className="h-10 pl-9"
            />
          </div>
        </div>

        {courts.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCourtFilter('all')}
              className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition"
              style={
                courtFilter === 'all'
                  ? { backgroundColor: `${BRAND.emerald}33`, color: BRAND.emerald }
                  : { backgroundColor: BRAND.grayBg, color: BRAND.white }
              }
            >
              Todas las canchas
            </button>
            {courts.map((court) => (
              <button
                key={court.id}
                type="button"
                onClick={() => setCourtFilter(court.id)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition"
                style={
                  courtFilter === court.id
                    ? { backgroundColor: `${BRAND.emerald}33`, color: BRAND.emerald }
                    : { backgroundColor: BRAND.grayBg, color: BRAND.white }
                }
              >
                {court.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            className="h-10 w-full font-heading font-semibold uppercase tracking-wide sm:w-auto"
            onClick={() => setAddOpen(true)}
            disabled={!venueId}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva reserva telefónica
          </Button>
          <p className="text-[11px] text-muted-foreground sm:text-right">
            Ideal para reservas por llamada telefónica.
          </p>
        </div>
        {addError && <p className="text-sm text-destructive">{addError}</p>}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className="rounded-full px-3 py-1 font-semibold"
          style={{ backgroundColor: `${BRAND.emerald}33`, color: BRAND.emerald }}
        >
          Confirmadas {stats.confirmed}
        </span>
        <span
          className="rounded-full px-3 py-1 font-semibold"
          style={{ backgroundColor: BRAND.grayBg, color: BRAND.white }}
        >
          Pendientes {stats.pending}
        </span>
        <span
          className="rounded-full px-3 py-1 font-semibold"
          style={{ backgroundColor: `${BRAND.orange}33`, color: BRAND.orange }}
        >
          Canceladas {stats.cancelled}
        </span>
      </div>

      {/* Selector de días (Semana y Día usan timeline vertical) */}
      {(view === 'week' || view === 'day') && (
        <>
          {view === 'week' && (
            <div className="grid grid-cols-7 gap-1 rounded-2xl ef-card p-2 sm:gap-2 sm:p-3">
              {weekDays.map((day) => {
                const isSelected = sameDay(day, anchor)
                const isToday = sameDay(day, new Date())
                const count = (eventsByDay.get(day.toDateString()) ?? []).length
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setAnchor(startOfDay(day))}
                    className="flex flex-col items-center rounded-xl py-2 transition hover:bg-white/5"
                    style={
                      isSelected
                        ? { backgroundColor: `${BRAND.emerald}22` }
                        : undefined
                    }
                  >
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-[11px]">
                      {day.toLocaleDateString('es', { weekday: 'short' })}
                    </span>
                    <span
                      className="mt-1 flex h-9 w-9 items-center justify-center rounded-full font-heading text-base font-bold sm:h-10 sm:w-10 sm:text-lg"
                      style={{
                        backgroundColor:
                          isSelected || isToday ? BRAND.emerald : 'transparent',
                        color:
                          isSelected || isToday ? BRAND.onEmerald : BRAND.white,
                      }}
                    >
                      {day.getDate()}
                    </span>
                    {count > 0 && (
                      <span className="mt-1 text-[10px] text-muted-foreground">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <DayTimeline
            day={anchor}
            eventsByHour={eventsByDayHour}
            onOpen={setSelectedId}
          />
        </>
      )}

      {view === 'month' && (
        <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl ef-card p-3 sm:p-5">
          <div className="grid grid-cols-7 gap-1 pb-2">
            {['do.', 'lu.', 'ma.', 'mi.', 'ju.', 'vi.', 'sá.'].map((label) => (
              <div
                key={label}
                className="py-1 text-center text-[11px] font-medium text-muted-foreground sm:text-sm"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const inMonth = day.getMonth() === anchor.getMonth()
              const isToday = sameDay(day, new Date())
              const isSelected = sameDay(day, anchor)
              const dayEvents = eventsByDay.get(day.toDateString()) ?? []
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    setAnchor(startOfDay(day))
                    setView('day')
                  }}
                  className="flex min-h-[3.25rem] flex-col items-center rounded-xl p-1 transition hover:bg-white/5 sm:min-h-[4.25rem]"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold sm:h-9 sm:w-9"
                    style={{
                      color: !inMonth
                        ? BRAND.gray
                        : isSelected || isToday
                          ? BRAND.onEmerald
                          : BRAND.white,
                      backgroundColor:
                        isSelected || isToday ? BRAND.emerald : 'transparent',
                      opacity: inMonth ? 1 : 0.45,
                    }}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                    {dayEvents.slice(0, 5).map((event) => (
                      <span
                        key={event.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            event.status === 'confirmed'
                              ? BRAND.emerald
                              : event.status === 'cancelled'
                                ? BRAND.orange
                                : BRAND.gray,
                        }}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && nameQuery.trim() && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Sin resultados para “{nameQuery.trim()}”.
        </p>
      )}

      {selected && (
        <ReservationModal
          event={selected}
          onClose={() => setSelectedId(null)}
          courts={courts}
          allReservations={reservations}
        />
      )}

      <AddReservationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={async (payload) => {
          setAddError(null)
          try {
            await handleCreatePhoneReservation(payload)
          } catch (err) {
            setAddError(
              err instanceof Error ? err.message : 'No se pudo crear la reserva.',
            )
            throw err
          }
        }}
        courts={courts}
        defaultDate={anchor}
      />
    </div>
  )
}
