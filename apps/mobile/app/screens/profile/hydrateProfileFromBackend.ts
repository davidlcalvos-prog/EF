import type { PhysicalTestState, TestRawResult } from "@/data/mockPlayerProfile"
import { api } from "@/services/api"
import type { PlayerProfileSnapshot, PsychTestResult } from "@/utils/playerProfileStorage"
import { createDefaultProfile, loadPlayerProfile, savePlayerProfile } from "@/utils/playerProfileStorage"
import type { ProfileStatsSnapshot } from "@/utils/profileStatsStorage"
import { loadProfileStats, saveProfileStats } from "@/utils/profileStatsStorage"

/**
 * Reconstruye el perfil "rico" (stats, tests físicos, evaluación psicológica,
 * posición favorita) desde el backend y lo guarda en MMKV.
 *
 * Backend es la fuente de verdad para estos campos: si hay datos locales y
 * remotos que difieren, el remoto gana (no hay UI de resolución de conflictos
 * en esta tarea). El resto del perfil local (nombre, apodo, bio, avatar) no
 * se toca — esos campos no se sincronizan todavía.
 */
export async function hydrateProfileFromBackend(
  userKey: string,
  authEmail?: string,
): Promise<boolean> {
  const response = await api.getProfileStats()
  if (response.kind !== "ok") {
    if (__DEV__) console.warn("[profileStats] hidratación desde backend falló:", response.kind)
    return false
  }

  const { data } = response

  const tests: PhysicalTestState[] = Object.entries(data.latestTestResults).map(
    ([testId, result]) => ({
      id: testId as PhysicalTestState["id"],
      lastCompletedAt: result!.completedAt,
      rawResult: result!.rawData as unknown as TestRawResult,
      score: result!.score,
    }),
  )

  const statsSnapshot: ProfileStatsSnapshot = {
    stats: data.stats
      ? {
          attack: data.stats.attack,
          defense: data.stats.defense,
          endurance: data.stats.endurance,
          speed: data.stats.speed,
          passes: data.stats.passes,
          dribbling: data.stats.dribbling,
        }
      : { attack: 0, defense: 0, endurance: 0, speed: 0, passes: 0, dribbling: 0 },
    tests,
  }
  saveProfileStats(userKey, statsSnapshot)

  const psychTest: PsychTestResult | undefined = data.latestPsychAssessment
    ? {
        completedAt: data.latestPsychAssessment.completedAt,
        teamworkScore: data.latestPsychAssessment.teamworkScore,
        onFieldScore: data.latestPsychAssessment.onFieldScore,
        overallScore: data.latestPsychAssessment.overallScore,
        answers: data.latestPsychAssessment.answers,
        traits: data.latestPsychAssessment.traits,
      }
    : undefined

  const existingProfileSnapshot = loadPlayerProfile(userKey)
  const nextProfileSnapshot: PlayerProfileSnapshot = {
    profile: {
      ...(existingProfileSnapshot?.profile ?? createDefaultProfile(authEmail)),
      favoritePositionId: data.favoritePosition,
    },
    psychTest,
  }
  savePlayerProfile(userKey, nextProfileSnapshot)

  return true
}

/** true si no hay ningún dato "rico" local para este usuario todavía. */
export function hasNoLocalProfileStats(userKey: string): boolean {
  const stats = loadProfileStats(userKey)
  const profile = loadPlayerProfile(userKey)
  const hasCompletedTests = stats?.tests.some((test) => test.score != null) ?? false
  return !hasCompletedTests && !profile?.psychTest && !profile?.profile.favoritePositionId
}
