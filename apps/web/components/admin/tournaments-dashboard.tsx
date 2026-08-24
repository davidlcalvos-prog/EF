'use client'

import { useState, useTransition } from 'react'
import { Plus, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminPageHeader } from '@/components/admin/page-header'
import { TournamentDetail } from '@/components/admin/tournament-detail'
import {
  createTournamentAction,
  deleteTournamentAction as deletePrivateTournamentAction,
} from '@/app/admin/(portal)/torneos/actions'
import {
  createEliteForgeTournamentAction,
  deleteTournamentAction as deleteEliteForgeTournamentAction,
} from '@/app/admin/(portal)/campeonatos-elite-forge/actions'
import {
  MAX_TEAMS,
  WEEKDAY_OPTIONS,
  DEFAULT_SCHEDULE,
  courtSizeLabel,
  formatLabel,
  maxPlayersPerTeam,
  type CourtSize,
  type ScheduleConfig,
  type Tournament,
  type TournamentFormat,
  type TournamentKind,
} from '@/lib/dal/admin/tournaments'
import type { VenueRow } from '@/lib/dal/admin/types'

export function TournamentsDashboard({
  kind,
  initialTournaments,
  venues,
  loadError,
}: {
  kind: TournamentKind
  initialTournaments: Tournament[]
  /** Solo relevante para kind='private' — elite_forge no tiene cancha fija. */
  venues: VenueRow[]
  loadError: string | null
}) {
  const isEliteForge = kind === 'elite_forge'
  const [items, setItems] = useState<Tournament[]>(initialTournaments)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [createError, setCreateError] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftVenueId, setDraftVenueId] = useState(venues[0]?.id ?? '')
  const [draftSize, setDraftSize] = useState<CourtSize>('6vs6')
  const [draftFormat, setDraftFormat] =
    useState<TournamentFormat>('groups_of_4')
  const [draftMax, setDraftMax] = useState(16)
  const [draftKeys, setDraftKeys] = useState(4)
  const [draftSchedule, setDraftSchedule] = useState<ScheduleConfig>({
    ...DEFAULT_SCHEDULE,
    weekdays: [...DEFAULT_SCHEDULE.weekdays],
  })

  const selected = items.find((t) => t.id === selectedId) ?? null

  function replaceItem(next: Tournament) {
    setItems((prev) => {
      const idx = prev.findIndex((t) => t.id === next.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = next
        return copy
      }
      return [next, ...prev]
    })
  }

  function toggleDraftDay(day: number) {
    setDraftSchedule((prev) => {
      const weekdays = prev.weekdays.includes(day)
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day].sort((a, b) => a - b)
      return {
        ...prev,
        weekdays: weekdays.length ? weekdays : [...DEFAULT_SCHEDULE.weekdays],
      }
    })
  }

  function handleCreate() {
    if (!isEliteForge && !draftVenueId) {
      setCreateError('Elegí una cancha para el torneo.')
      return
    }
    setCreateError(null)
    startTransition(async () => {
      try {
        const basePayload = {
          name: draftName.trim() || 'Nuevo torneo',
          courtSize: draftSize,
          format: draftFormat,
          maxTeams: Math.min(MAX_TEAMS, Math.max(2, draftMax)),
          bracketKeys: Math.max(1, draftKeys),
          schedule: draftSchedule,
        }
        const tournament = isEliteForge
          ? await createEliteForgeTournamentAction(basePayload)
          : await createTournamentAction({ ...basePayload, venueId: draftVenueId })
        replaceItem(tournament)
        setCreating(false)
        setDraftName('')
        setSelectedId(tournament.id)
      } catch (error) {
        setCreateError(
          error instanceof Error
            ? error.message
            : `No se pudo crear el ${isEliteForge ? 'campeonato' : 'torneo'}`,
        )
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      if (isEliteForge) {
        await deleteEliteForgeTournamentAction(id)
      } else {
        await deletePrivateTournamentAction(id)
      }
      setItems((prev) => prev.filter((t) => t.id !== id))
      setSelectedId(null)
    })
  }

  if (selected) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <TournamentDetail
          tournament={selected}
          onChange={replaceItem}
          onBack={() => setSelectedId(null)}
          onDelete={() => handleDelete(selected.id)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <AdminPageHeader
        title={isEliteForge ? 'Campeonatos Elite Forge' : 'Torneos'}
        subtitle={
          isEliteForge
            ? 'Torneos oficiales de Elite Forge: los grupos se inscriben con jugadores reales, la cancha se asigna al azar entre las canchas sintéticas registradas.'
            : 'Crea torneos 6/8/11, agenda días/horarios en calendario, registra equipos y rankings.'
        }
      />

      {loadError && (
        <p className="mb-4 text-sm text-destructive">{loadError}</p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Máximo {MAX_TEAMS} equipos por {isEliteForge ? 'campeonato' : 'torneo'}.
        </p>
        {(isEliteForge || venues.length > 0) && (
          <Button type="button" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Crear {isEliteForge ? 'campeonato' : 'torneo'}
          </Button>
        )}
      </div>

      {!isEliteForge && venues.length === 0 && (
        <div className="mb-6 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no tenés ninguna cancha registrada. Agregá una en{' '}
            <span className="font-medium text-foreground">Mi cancha</span>{' '}
            antes de crear un torneo — cada torneo se juega sobre una cancha
            propia.
          </p>
        </div>
      )}

      {creating && (
        <section className="mb-8 space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight">
            Nuevo {isEliteForge ? 'campeonato' : 'torneo'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-name">Nombre</Label>
              <Input
                id="new-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={isEliteForge ? 'Copa Elite Forge Apertura' : 'Copa Elite Forge'}
              />
            </div>
            {!isEliteForge && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="new-venue">Cancha</Label>
                <select
                  id="new-venue"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  value={draftVenueId}
                  onChange={(e) => setDraftVenueId(e.target.value)}
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-size">Cancha (formato)</Label>
              <select
                id="new-size"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={draftSize}
                onChange={(e) => setDraftSize(e.target.value as CourtSize)}
              >
                <option value="6vs6">
                  6 vs 6 — hasta {maxPlayersPerTeam('6vs6')} jugadores/equipo
                </option>
                <option value="8vs8">
                  8 vs 8 — hasta {maxPlayersPerTeam('8vs8')} jugadores/equipo
                </option>
                <option value="11vs11">
                  11 vs 11 — hasta {maxPlayersPerTeam('11vs11')} jugadores/equipo
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-format">Modalidad</Label>
              <select
                id="new-format"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={draftFormat}
                onChange={(e) =>
                  setDraftFormat(e.target.value as TournamentFormat)
                }
              >
                <option value="groups_of_4">Grupos de 4</option>
                <option value="round_robin">
                  Todos contra todos (top 4 clasifican)
                </option>
                <option value="brackets">Llaves / eliminación</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-max">Cupo de equipos</Label>
              <Input
                id="new-max"
                type="number"
                min={2}
                max={MAX_TEAMS}
                value={draftMax}
                onChange={(e) => setDraftMax(Number(e.target.value || 16))}
              />
            </div>
            {draftFormat === 'brackets' && (
              <div className="space-y-2">
                <Label htmlFor="new-keys">Llaves iniciales</Label>
                <Input
                  id="new-keys"
                  type="number"
                  min={1}
                  max={8}
                  value={draftKeys}
                  onChange={(e) => setDraftKeys(Number(e.target.value || 4))}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border/70 bg-secondary/20 p-4">
            <p className="font-heading text-xs font-bold uppercase tracking-wide">
              Días y horarios (reservas automáticas)
            </p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((d) => {
                const on = draftSchedule.weekdays.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDraftDay(d.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      on
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Desde (hora)</Label>
                <Input
                  type="number"
                  min={6}
                  max={22}
                  value={draftSchedule.startHour}
                  onChange={(e) =>
                    setDraftSchedule((s) => ({
                      ...s,
                      startHour: Number(e.target.value || 18),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Hasta (hora)</Label>
                <Input
                  type="number"
                  min={7}
                  max={23}
                  value={draftSchedule.endHour}
                  onChange={(e) =>
                    setDraftSchedule((s) => ({
                      ...s,
                      endHour: Number(e.target.value || 22),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Canchas</Label>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  value={draftSchedule.courtsPerSlot}
                  onChange={(e) =>
                    setDraftSchedule((s) => ({
                      ...s,
                      courtsPerSlot: Number(e.target.value) as 1 | 2,
                    }))
                  }
                >
                  <option value={1}>1 (~4 partidos/día)</option>
                  <option value={2}>2 (~8 partidos/día)</option>
                </select>
              </div>
            </div>
          </div>

          {createError && (
            <p className="text-sm text-destructive">{createError}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Creando…' : 'Crear'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreating(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Todavía no hay {isEliteForge ? 'campeonatos' : 'torneos'}. Crea el
            primero para inscribir equipos y armar llaves o grupos.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/40"
              >
                <div>
                  <p className="font-heading text-lg font-bold uppercase italic tracking-tight">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {courtSizeLabel(item.courtSize)} · {formatLabel(item.format)}{' '}
                    · {item.teams.length}/{item.maxTeams} equipos ·{' '}
                    {item.matches.length} partidos
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
