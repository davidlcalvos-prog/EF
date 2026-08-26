'use client'

import { useState, useTransition } from 'react'
import { CalendarX2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { releaseAssignedMatch } from '@/app/admin/(portal)/copa-elite-forge/actions'
import { formatReservationSchedule } from '@/lib/dal/admin/reservation-format'
import type { AssignedTournamentMatch } from '@/lib/dal/admin/tournaments-api'

const MATCH_STATUS_LABELS: Record<AssignedTournamentMatch['matchStatus'], string> = {
  scheduled: 'Programado',
  played: 'Jugado',
  walkover_home: 'W a favor local',
  walkover_away: 'W a favor visitante',
}

const RESERVATION_STATUS_LABELS: Record<
  NonNullable<AssignedTournamentMatch['reservationStatus']>,
  string
> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Liberada',
}

export function CopaEliteForgeList({ matches }: { matches: AssignedTournamentMatch[] }) {
  const [isPending, startTransition] = useTransition()
  const [releasingId, setReleasingId] = useState<string | null>(null)

  function handleRelease(reservationId: string) {
    setReleasingId(reservationId)
    startTransition(async () => {
      await releaseAssignedMatch(reservationId)
      setReleasingId(null)
    })
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Todavía no te tocó ningún partido de Copa Elite Forge. Se asignan al
          azar entre las canchas sintéticas registradas cuando un
          administrador genera el fixture de un campeonato.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {matches.map((match) => (
        <li
          key={match.matchId}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <div>
            <p className="text-[11px] uppercase tracking-wide text-primary">
              {match.tournamentName} · Cancha {match.courtNumber}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {match.startsAt && match.endsAt
                ? formatReservationSchedule(match.startsAt, match.endsAt)
                : 'Sin fecha'}
            </p>
            <p className="mt-1 font-heading text-sm font-semibold">
              {match.homeTeamName} vs {match.awayTeamName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {MATCH_STATUS_LABELS[match.matchStatus]}
              {match.reservationStatus &&
                ` · Reserva ${RESERVATION_STATUS_LABELS[match.reservationStatus]}`}
            </p>
          </div>

          {match.reservationId && match.reservationStatus !== 'cancelled' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending && releasingId === match.reservationId}
              onClick={() => handleRelease(match.reservationId as string)}
            >
              <CalendarX2 className="mr-1 h-4 w-4" />
              {isPending && releasingId === match.reservationId
                ? 'Liberando…'
                : 'Liberar cancha'}
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}
