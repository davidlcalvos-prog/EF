'use client'

import { useMemo } from 'react'
import type { ReservationRow } from '@/lib/dal/admin/types'
import {
  computeClientStats,
  computeDayOccupancy,
  computeHourOccupancy,
  computeSourceBreakdown,
} from '@/lib/dal/admin/analytics'
import { AdminPageHeader } from '@/components/admin/page-header'
import { eliteForgeColors } from '@/lib/theme/elite-forge'

const BRAND = {
  emerald: eliteForgeColors.emerald,
  orange: eliteForgeColors.orange,
  gray: eliteForgeColors.muted,
} as const

function pct(value: number) {
  return `${Math.round(value * 100)}%`
}

function Bar({
  value,
  max,
  color,
}: {
  value: number
  max: number
  color: string
}) {
  const width = max <= 0 ? 0 : Math.max(6, Math.round((value / max) * 100))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  )
}

export function AnalyticsDashboard({
  reservations,
}: {
  reservations: ReservationRow[]
}) {
  const dayStats = useMemo(() => computeDayOccupancy(reservations), [reservations])
  const hourStats = useMemo(() => computeHourOccupancy(reservations), [reservations])
  const clients = useMemo(() => computeClientStats(reservations), [reservations])
  const sources = useMemo(() => computeSourceBreakdown(reservations), [reservations])

  const maxDay = Math.max(1, ...dayStats.byDay.map((d) => d.count))
  const maxHour = Math.max(
    1,
    ...hourStats.busiestHours.map((h) => h.count),
    ...hourStats.quietestHours.map((h) => h.count),
  )
  const maxClient = Math.max(1, ...clients.slice(0, 8).map((c) => c.total), 1)
  const maxSource = Math.max(1, ...sources.map((s) => s.count))

  const activeCount = reservations.filter((r) => r.status !== 'cancelled').length
  const cancelledCount = reservations.filter((r) => r.status === 'cancelled').length

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analíticas"
        subtitle="Ocupación de canchas, horarios pico y fidelidad de clientes a partir de tus reservas."
        breadcrumbs={[
          { label: 'Resumen', href: '/admin' },
          { label: 'Analíticas' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl ef-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Reservas activas
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-foreground">
            {activeCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pendientes + confirmadas
          </p>
        </div>
        <div className="rounded-2xl ef-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Canceladas
          </div>
          <p
            className="mt-2 font-heading text-3xl font-bold"
            style={{ color: BRAND.orange }}
          >
            {cancelledCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            En el historial analizado
          </p>
        </div>
        <div className="rounded-2xl ef-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Clientes únicos
          </p>
          <p
            className="mt-2 font-heading text-3xl font-bold"
            style={{ color: BRAND.emerald }}
          >
            {clients.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Incluye app y teléfono
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl ef-card p-5">
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
            Días con más ocupación
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Días y horarios donde más se reservan las canchas.
          </p>
          <ul className="mt-5 space-y-4">
            {dayStats.busiest.map((day) => (
              <li key={day.dayIndex} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">
                    {day.dayLabel}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: BRAND.emerald }}
                  >
                    {day.count} reservas
                  </span>
                </div>
                <Bar value={day.count} max={maxDay} color={BRAND.emerald} />
                {day.topHours.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Horarios pico:{' '}
                    {day.topHours
                      .map((h) => `${h.label} (${h.count})`)
                      .join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl ef-card p-5">
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
            Días con menos ocupación
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Oportunidades para promociones o mantenimiento.
          </p>
          <ul className="mt-5 space-y-4">
            {dayStats.quietest.map((day) => (
              <li key={day.dayIndex} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">
                    {day.dayLabel}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">
                    {day.count} reservas
                  </span>
                </div>
                <Bar value={day.count} max={maxDay} color={BRAND.gray} />
                {day.topHours.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Con algo de actividad:{' '}
                    {day.topHours
                      .map((h) => `${h.label} (${h.count})`)
                      .join(' · ')}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sin reservas activas registradas ese día.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl ef-card p-5">
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
            Horarios más demandados
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Franjas 8 AM – 10 PM con mayor ocupación.
          </p>
          <ul className="mt-5 space-y-3">
            {hourStats.busiestHours.map((hour) => (
              <li key={hour.hour} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>{hour.label}</span>
                  <span style={{ color: BRAND.emerald }}>{hour.count}</span>
                </div>
                <Bar value={hour.count} max={maxHour} color={BRAND.emerald} />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl ef-card p-5">
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
            Horarios menos ocupados
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Franjas con menor demanda (ideal para ofertas).
          </p>
          <ul className="mt-5 space-y-3">
            {hourStats.quietestHours.map((hour) => (
              <li key={hour.hour} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>{hour.label}</span>
                  <span className="text-muted-foreground">{hour.count}</span>
                </div>
                <Bar value={hour.count} max={maxHour} color={BRAND.gray} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl ef-card p-5">
        <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
          Reservas por origen
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          App, teléfono, torneo o bloqueo manual.
        </p>
        <ul className="mt-5 space-y-3">
          {sources.map((s) => (
            <li key={s.source} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>{s.label}</span>
                <span style={{ color: BRAND.emerald }}>{s.count}</span>
              </div>
              <Bar value={s.count} max={maxSource} color={BRAND.emerald} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl ef-card p-5">
        <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
          Clientes más frecuentes
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Volumen de reservas y cumplimiento (qué tan seguido cancelan).
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-3 font-medium">Cliente</th>
                <th className="pb-3 pr-3 font-medium">Reservas</th>
                <th className="pb-3 pr-3 font-medium">Confirmadas</th>
                <th className="pb-3 pr-3 font-medium">Canceladas</th>
                <th className="pb-3 pr-3 font-medium">% cancelación</th>
                <th className="pb-3 font-medium">Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {clients.slice(0, 10).map((client) => (
                <tr
                  key={client.name}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="py-3 pr-3 font-semibold text-foreground">
                    {client.name}
                    <div className="mt-1 max-w-[140px]">
                      <Bar
                        value={client.total}
                        max={maxClient}
                        color={BRAND.emerald}
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-3">{client.total}</td>
                  <td className="py-3 pr-3">{client.confirmed}</td>
                  <td className="py-3 pr-3" style={{ color: BRAND.orange }}>
                    {client.cancelled}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor:
                          client.cancelRate >= 0.4
                            ? `${BRAND.orange}33`
                            : client.cancelRate >= 0.2
                              ? `${BRAND.gray}33`
                              : `${BRAND.emerald}33`,
                        color:
                          client.cancelRate >= 0.4
                            ? BRAND.orange
                            : client.cancelRate >= 0.2
                              ? BRAND.gray
                              : BRAND.emerald,
                      }}
                    >
                      {pct(client.cancelRate)}
                    </span>
                  </td>
                  <td className="py-3">{pct(client.fulfillmentRate)}</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Aún no hay reservas para analizar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
