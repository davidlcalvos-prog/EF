/**
 * Llamadas reales al backend (Fase 7.1) — server-only (usa apiFetchAuth, que
 * depende de next/headers). Separado de tournaments.ts a propósito: ese
 * archivo tiene tipos y helpers puros que sí importan componentes cliente
 * (tournaments-dashboard.tsx, tournament-detail.tsx), y mezclar ambos en un
 * solo módulo arrastra next/headers al bundle del cliente (rompe el build:
 * "You're importing a module that depends on next/headers... in the Pages
 * Router" — en realidad ocurre igual en App Router para Client Components).
 * Solo lo importan page.tsx (Server Component) y actions.ts ('use server').
 */
import { apiFetchAuth } from '@/lib/api/server-client'
import type {
  CourtSize,
  GenerateFixtureResult,
  MatchPlayerStat,
  MatchStatus,
  ScheduleConfig,
  Team,
  Tournament,
  TournamentFormat,
  TournamentStatus,
} from '@/lib/dal/admin/tournaments'

export async function listTournamentsMine(): Promise<Tournament[]> {
  return apiFetchAuth<Tournament[]>('tournaments/mine')
}

export async function getTournamentMine(id: string): Promise<Tournament> {
  return apiFetchAuth<Tournament>(`tournaments/mine/${id}`)
}

export async function createTournament(payload: {
  name: string
  venueId: string
  courtSize: CourtSize
  format: TournamentFormat
  maxTeams: number
  bracketKeys: number
  schedule: ScheduleConfig
}): Promise<Tournament> {
  return apiFetchAuth<Tournament>('tournaments/mine', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTournament(
  id: string,
  patch: Partial<{
    name: string
    courtSize: CourtSize
    format: TournamentFormat
    maxTeams: number
    bracketKeys: number
    extraRoundEnabled: boolean
    status: TournamentStatus
    schedule: ScheduleConfig
  }>,
): Promise<Tournament> {
  return apiFetchAuth<Tournament>(`tournaments/mine/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteTournamentApi(id: string): Promise<void> {
  await apiFetchAuth(`tournaments/mine/${id}`, { method: 'DELETE' })
}

export async function upsertTournamentTeams(
  id: string,
  teams: Team[],
): Promise<Tournament> {
  // El endpoint solo acepta id/name/groupId/players — el resto (wins,
  // points, etc.) son agregados de solo lectura que el backend recalcula
  // en UPDATE_MATCH_RESULT; el ValidationPipe global (whitelist estricto)
  // rechaza el body entero si viajan de más.
  const input = teams.map((t) => ({
    id: t.id,
    name: t.name,
    groupId: t.groupId,
    players: t.players.map((p) => ({
      id: p.id,
      name: p.name,
      isGoalkeeper: p.isGoalkeeper,
    })),
  }))
  return apiFetchAuth<Tournament>(`tournaments/mine/${id}/teams`, {
    method: 'PUT',
    body: JSON.stringify({ teams: input }),
  })
}

export async function generateTournamentFixture(
  id: string,
): Promise<GenerateFixtureResult> {
  return apiFetchAuth<GenerateFixtureResult>(
    `tournaments/mine/${id}/generate-fixture`,
    { method: 'POST' },
  )
}

export async function addTournamentExtraRound(
  id: string,
): Promise<GenerateFixtureResult> {
  return apiFetchAuth<GenerateFixtureResult>(
    `tournaments/mine/${id}/extra-round`,
    { method: 'POST' },
  )
}

export async function updateTournamentMatchResult(
  id: string,
  matchId: string,
  payload: {
    status: MatchStatus
    homeGoals: number | null
    awayGoals: number | null
    playerStats: MatchPlayerStat[]
  },
): Promise<Tournament> {
  return apiFetchAuth<Tournament>(`tournaments/mine/${id}/matches/${matchId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
