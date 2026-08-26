'use client'

import {
  leastBeatenGoalkeepers,
  topScorers,
  type Tournament,
} from '@/lib/dal/admin/tournaments'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { eliteForgeColors, medalColors } from '@/lib/theme/elite-forge'

const BRAND = { emerald: eliteForgeColors.emerald, orange: eliteForgeColors.orange } as const

function Podium({
  title,
  subtitle,
  rows,
  unit,
  invertRankColor,
}: {
  title: string
  subtitle: string
  rows: Array<{ playerName: string; teamName: string; value: number }>
  unit: string
  invertRankColor?: boolean
}) {
  const medals = [...medalColors, BRAND.emerald, BRAND.orange]

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-heading text-lg font-bold uppercase italic tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Todavía no hay datos. Registra resultados de partidos.
        </p>
      ) : (
        <ol className="mt-6 space-y-3">
          {rows.map((row, i) => (
            <li
              key={`${row.playerName}-${row.teamName}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/20 px-3 py-3"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold text-background"
                style={{ backgroundColor: medals[i] ?? BRAND.emerald }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {row.playerName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.teamName}
                </p>
              </div>
              <p
                className="font-heading text-xl font-bold"
                style={{
                  color: invertRankColor ? BRAND.emerald : BRAND.orange,
                }}
              >
                {row.value}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {unit}
                </span>
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export function TournamentRankingsModal({
  tournament,
  onClose,
}: {
  tournament: Tournament
  onClose: () => void
}) {
  const scorers = topScorers(tournament, 5)
  const keepers = leastBeatenGoalkeepers(tournament, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold uppercase italic tracking-tight">
              Rankings · {tournament.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Podio 1–5: goleadores y valla menos vencida.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Podium
            title="Goleadores"
            subtitle="Jugadores con más goles en el torneo"
            rows={scorers}
            unit="goles"
          />
          <Podium
            title="Valla menos vencida"
            subtitle="Arqueros con menos goles en contra"
            rows={keepers}
            unit="GC"
            invertRankColor
          />
        </div>
      </div>
    </div>
  )
}
