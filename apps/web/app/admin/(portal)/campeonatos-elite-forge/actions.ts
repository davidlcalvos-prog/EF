'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin/session'
import {
  addTournamentExtraRound,
  createEliteForgeTournament,
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

/**
 * Mismos nombres de función y firmas que apps/web/app/admin/(portal)/torneos/actions.ts
 * a propósito: TournamentDetail elige el módulo correcto en runtime según
 * `tournament.kind`, así no necesita conocer de qué página vino. Lo único
 * que cambia acá es qué llamada del backend se usa para crear (sin cancha) y
 * qué paths se revalidan.
 */

export async function createEliteForgeTournamentAction(payload: {
  name: string
  courtSize: CourtSize
  format: TournamentFormat
  maxTeams: number
  bracketKeys: number
  schedule: ScheduleConfig
}): Promise<Tournament> {
  await requireAdminSession()
  const tournament = await createEliteForgeTournament(payload)
  revalidatePath('/admin/campeonatos-elite-forge')
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
  revalidatePath('/admin/campeonatos-elite-forge')
  return tournament
}

export async function deleteTournamentAction(id: string): Promise<void> {
  await requireAdminSession()
  await deleteTournamentApi(id)
  revalidatePath('/admin/campeonatos-elite-forge')
  revalidatePath('/admin/copa-elite-forge')
}

export async function upsertTournamentTeamsAction(
  id: string,
  teams: Team[],
): Promise<Tournament> {
  await requireAdminSession()
  const tournament = await upsertTournamentTeams(id, teams)
  revalidatePath('/admin/campeonatos-elite-forge')
  return tournament
}

export async function generateTournamentFixtureAction(
  id: string,
): Promise<GenerateFixtureResult> {
  await requireAdminSession()
  const result = await generateTournamentFixture(id)
  revalidatePath('/admin/campeonatos-elite-forge')
  revalidatePath('/admin/copa-elite-forge')
  return result
}

export async function addTournamentExtraRoundAction(
  id: string,
): Promise<GenerateFixtureResult> {
  await requireAdminSession()
  const result = await addTournamentExtraRound(id)
  revalidatePath('/admin/campeonatos-elite-forge')
  revalidatePath('/admin/copa-elite-forge')
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
  revalidatePath('/admin/campeonatos-elite-forge')
  return tournament
}
