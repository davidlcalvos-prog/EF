'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminPageHeader } from '@/components/admin/page-header'
import type { ReservationRow, VenueRow } from '@/lib/dal/admin/types'
import { computeLiveOccupancy } from '@/lib/dal/admin/court-occupancy'
import { eliteForgeColors } from '@/lib/theme/elite-forge'
import dynamic from 'next/dynamic'

// Leaflet toca window — solo cliente (mapa de solo lectura si hay pin).
const VenueLocationMap = dynamic(() => import('@/components/admin/venue-location-map'), {
  ssr: false,
})

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
  const courts = useMemo(() => venues[0]?.courts ?? [], [venues])
  const activeCourts = useMemo(
    () => courts.filter((c) => c.is_active),
    [courts],
  )
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const occupancy = useMemo(
    () => computeLiveOccupancy(courts, reservations, now),
    [courts, reservations, now],
  )

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

      {activeCourts.length === 0 ? (
        <section className="mb-6 rounded-2xl border border-accent/40 bg-accent/10 p-5">
          <p className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
            Agregá al menos una cancha para empezar a recibir reservas.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Configurá el inventario de canchas de tu complejo.
          </p>
          <Button
            render={<Link href="/admin/mi-cancha" />}
            className="mt-3"
            size="sm"
          >
            Ir a Mi cancha
          </Button>
        </section>
      ) : (
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
              Editar canchas
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl ef-card p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Canchas activas
              </p>
              <p className="mt-2 font-heading text-3xl font-bold text-foreground">
                {activeCourts.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {occupancy.bySize
                  .filter((s) => s.capacity > 0)
                  .map((s) => `${s.capacity}×${s.label}`)
                  .join(' · ') || 'Sin canchas configuradas'}
              </p>
            </div>
            <div className="rounded-2xl ef-card p-5">
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
            <div className="rounded-2xl ef-card p-5">
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
            {occupancy.bySize
              .filter((row) => row.capacity > 0)
              .map((row) => (
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
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl ef-card p-5">
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
        <div className="rounded-2xl ef-card p-5">
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
        <div className="mt-6 rounded-2xl ef-card/80 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Cancha principal
          </p>
          <p className="mt-1 font-heading text-xl font-semibold text-foreground">
            {venues[0].name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {venues[0].address || 'Sin dirección configurada'}
          </p>
          {venues[0].city ? (
            <p className="mt-1 text-sm text-primary">
              {venues[0].city}
              {venues[0].department ? `, ${venues[0].department}` : ''}
            </p>
          ) : null}
          {venues[0].location_source === 'pin' &&
          venues[0].latitude != null &&
          venues[0].longitude != null ? (
            <div className="mt-4">
              <VenueLocationMap
                center={[venues[0].latitude, venues[0].longitude]}
                pin={[venues[0].latitude, venues[0].longitude]}
                onPinChange={null}
                heightClass="h-44"
                zoom={15}
              />
            </div>
          ) : null}
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
