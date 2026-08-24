'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin/session'
import {
  addTournamentExtraRound,
  createTournament,
  deleteTournamentApi,
  generateTournamentFixture,
  updateTournament,
  updateTournamentMatchResult,
  upsertTournamentTeams,
} from '@/lib/dal/admin/tournaments-api'
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

export async function createTournamentAction(payload: {
  name: string
  venueId: string
  courtSize: CourtSize
  format: TournamentFormat
  maxTeams: number
  bracketKeys: number
  schedule: ScheduleConfig
}): Promise<Tournament> {
  await requireAdminSession()
  const tournament = await createTournament(payload)
  revalidatePath('/admin/torneos')
  return tournament
}

export async function updateTournamentAction(
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
  await requireAdminSession()
  const tournament = await updateTournament(id, patch)
  revalidatePath('/admin/torneos')
  return tournament
}

export async function deleteTournamentAction(id: string): Promise<void> {
  await requireAdminSession()
  await deleteTournamentApi(id)
  revalidatePath('/admin/torneos')
  revalidatePath('/admin/reservas')
}

export async function upsertTournamentTeamsAction(
  id: string,
  teams: Team[],
): Promise<Tournament> {
  await requireAdminSession()
  const tournament = await upsertTournamentTeams(id, teams)
  revalidatePath('/admin/torneos')
  return tournament
}

export async function generateTournamentFixtureAction(
  id: string,
): Promise<GenerateFixtureResult> {
  await requireAdminSession()
  const result = await generateTournamentFixture(id)
  revalidatePath('/admin/torneos')
  revalidatePath('/admin/reservas')
  return result
}

export async function addTournamentExtraRoundAction(
  id: string,
): Promise<GenerateFixtureResult> {
  await requireAdminSession()
  const result = await addTournamentExtraRound(id)
  revalidatePath('/admin/torneos')
  revalidatePath('/admin/reservas')
  return result
}

export async function updateTournamentMatchResultAction(
  id: string,
  matchId: string,
  payload: {
    status: MatchStatus
    homeGoals: number | null
    awayGoals: number | null
    playerStats: MatchPlayerStat[]
  },
): Promise<Tournament> {
  await requireAdminSession()
  const tournament = await updateTournamentMatchResult(id, matchId, payload)
  revalidatePath('/admin/torneos')
  return tournament
}
