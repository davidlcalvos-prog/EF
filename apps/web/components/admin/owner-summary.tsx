'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminPageHeader } from '@/components/admin/page-header'
import type { ReservationRow } from '@/lib/dal/admin/types'
import type { VenueRow } from '@/lib/dal/admin/types'
import {
  enrichReservationsForCalendar,
  type CalendarReservation,
} from '@/lib/dal/admin/mock-reservations'
import {
  computeLiveOccupancy,
  loadVenueExtras,
  totalCourts,
} from '@/lib/dal/admin/venue-extras'
import { eliteForgeColors } from '@/lib/theme/elite-forge'

const PHONE_KEY = 'ef-admin-phone-reservations'
const EDITS_KEY = 'ef-admin-edited-reservations'

const BRAND = {
  emerald: eliteForgeColors.emerald,
  orange: eliteForgeColors.orange,
  gray: eliteForgeColors.muted,
} as const

export function OwnerSummaryDashboard({
  firstName,
  venues,
  reservations,
}: {
  firstName: string
  venues: VenueRow[]
  reservations: ReservationRow[]
}) {
  const venueId = venues[0]?.id
  const [now, setNow] = useState(() => new Date())
  const [extras, setExtras] = useState(() => loadVenueExtras(venueId))
  const [extraReservations, setExtraReservations] = useState<
    CalendarReservation[]
  >([])
  const [edits, setEdits] = useState<Record<string, CalendarReservation>>({})

  useEffect(() => {
    setExtras(loadVenueExtras(venueId))
    try {
      const phone = localStorage.getItem(PHONE_KEY)
      if (phone) {
        const parsed = JSON.parse(phone) as CalendarReservation[]
        if (Array.isArray(parsed)) setExtraReservations(parsed)
      }
      const rawEdits = localStorage.getItem(EDITS_KEY)
      if (rawEdits) {
        const parsed = JSON.parse(rawEdits) as Record<
          string,
          CalendarReservation
        >
        if (parsed && typeof parsed === 'object') setEdits(parsed)
      }
    } catch {
      /* ignore */
    }
  }, [venueId])

  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const calendarItems = useMemo(() => {
    const base = [
      ...enrichReservationsForCalendar(reservations),
      ...extraReservations,
    ]
    return base.map((r) => edits[r.id] ?? r)
  }, [reservations, extraReservations, edits])

  const occupancy = useMemo(
    () => computeLiveOccupancy(extras, calendarItems, now),
    [extras, calendarItems, now],
  )

  const inventoryTotal = totalCourts(extras)
  const pending = reservations.filter((r) => r.status === 'pending').length
  const confirmed = reservations.filter((r) => r.status === 'confirmed').length
  const cancelled = reservations.filter((r) => r.status === 'cancelled').length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <AdminPageHeader
        title={`Hola, ${firstName}`}
        subtitle="Opera tus canchas: inventario, ocupación en tiempo real y reservas."
        breadcrumbs={[{ label: 'Resumen' }]}
      />

      <section className="mb-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
              Ocupación ahora
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Según la hora exacta ({occupancy.nowLabel}). Se actualiza cada 30 s.
            </p>
          </div>
          <Button
            render={<Link href="/admin/mi-cancha" />}
            variant="outline"
            size="sm"
          >
            Editar inventario
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Canchas totales
            </p>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">
              {inventoryTotal}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {extras.courts6}×6vs6 · {extras.courts8}×8vs8 ·{' '}
              {extras.courts11}×11vs11
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Ocupadas ahora
            </p>
            <p
              className="mt-2 font-heading text-3xl font-bold"
              style={{ color: BRAND.orange }}
            >
              {occupancy.totalOccupied}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Con reserva activa en este momento
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Libres ahora
            </p>
            <p
              className="mt-2 font-heading text-3xl font-bold"
              style={{ color: BRAND.emerald }}
            >
              {occupancy.totalFree}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Disponibles para reservar ya
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {occupancy.bySize.map((row) => (
            <div
              key={row.size}
              className="rounded-2xl border border-border/80 bg-secondary/25 p-4"
            >
              <p className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
                {row.label}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {row.capacity}
                </span>{' '}
                canchas ·{' '}
                <span style={{ color: BRAND.orange }}>{row.occupied}</span>{' '}
                ocupadas ·{' '}
                <span style={{ color: BRAND.emerald }}>{row.free}</span> libres
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${
                      row.capacity === 0
                        ? 0
                        : Math.round((row.occupied / row.capacity) * 100)
                    }%`,
                    backgroundColor: BRAND.orange,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Complejos
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-foreground">
            {venues.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sedes registradas en la cuenta
          </p>
        </div>
        <div className="rounded-2xl border border-accent/30 bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Pendientes
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-accent">
            {pending}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Esperan tu confirmación
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Confirmadas
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-foreground">
            {confirmed}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Canceladas: {cancelled}
          </p>
        </div>
      </div>

      {venues[0] && (
        <div className="mt-6 rounded-2xl border border-border bg-card/80 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Cancha principal
          </p>
          <p className="mt-1 font-heading text-xl font-semibold text-foreground">
            {venues[0].name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {venues[0].address || 'Sin dirección configurada'}
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button render={<Link href="/admin/reservas" />}>
          Abrir calendario
        </Button>
        <Button render={<Link href="/admin/mi-cancha" />} variant="outline">
          Configurar mi cancha
        </Button>
        <Button render={<Link href="/admin/analiticas" />} variant="outline">
          Ver analíticas
        </Button>
      </div>
    </div>
  )
}
