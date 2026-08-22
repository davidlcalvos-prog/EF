import {
  STAT_ORDER,
  type PhysicalTestState,
  type PlayerStats,
  type StatKey,
} from "@/data/mockPlayerProfile"
import type { PsychTraitKey } from "@/data/psychologicalTest"

export type PlayerPositionId =
  "goalkeeper" | "striker" | "winger" | "cam" | "cm" | "cdm" | "fullback" | "centerback"

export const ALL_PLAYER_POSITIONS: PlayerPositionId[] = [
  "goalkeeper",
  "striker",
  "winger",
  "cam",
  "cm",
  "cdm",
  "fullback",
  "centerback",
]

export interface PositionSuggestion {
  positionId: PlayerPositionId
  labelKey: `profileScreen:position_${PlayerPositionId}`
  confidence: number
  completedTests: number
  isReady: boolean
  dominantStats: StatKey[]
  fitScore: number
  psychInfluenced: boolean
}

const POSITION_LABEL_KEYS: Record<PlayerPositionId, PositionSuggestion["labelKey"]> = {
  goalkeeper: "profileScreen:position_goalkeeper",
  striker: "profileScreen:position_striker",
  winger: "profileScreen:position_winger",
  cam: "profileScreen:position_cam",
  cm: "profileScreen:position_cm",
  cdm: "profileScreen:position_cdm",
  fullback: "profileScreen:position_fullback",
  centerback: "profileScreen:position_centerback",
}

/** Perfil ideal de cada posición (pesos 0–1, suman ~1). */
const POSITION_WEIGHTS: Record<PlayerPositionId, Record<StatKey, number>> = {
  goalkeeper: {
    defense: 0.4,
    endurance: 0.15,
    passes: 0.15,
    speed: 0.1,
    dribbling: 0.05,
    attack: 0.05,
  },
  striker: {
    attack: 0.38,
    speed: 0.22,
    dribbling: 0.14,
    endurance: 0.1,
    passes: 0.06,
    defense: 0.1,
  },
  winger: {
    speed: 0.32,
    dribbling: 0.26,
    attack: 0.18,
    endurance: 0.12,
    passes: 0.07,
    defense: 0.05,
  },
  cam: {
    passes: 0.28,
    attack: 0.24,
    dribbling: 0.22,
    endurance: 0.12,
    speed: 0.09,
    defense: 0.05,
  },
  cm: {
    passes: 0.26,
    endurance: 0.24,
    defense: 0.16,
    dribbling: 0.14,
    attack: 0.1,
    speed: 0.1,
  },
  cdm: {
    defense: 0.32,
    passes: 0.24,
    endurance: 0.26,
    attack: 0.04,
    speed: 0.08,
    dribbling: 0.06,
  },
  fullback: {
    speed: 0.26,
    endurance: 0.24,
    defense: 0.22,
    passes: 0.14,
    dribbling: 0.09,
    attack: 0.05,
  },
  centerback: {
    defense: 0.42,
    endurance: 0.2,
    passes: 0.14,
    attack: 0.04,
    speed: 0.1,
    dribbling: 0.1,
  },
}

/**
 * Perfil mental ideal por posición (pesos 0–1). David solo definió los pesos
 * físicos de arquero (Fase 6.5.4.1) — estos psicológicos son criterio propio,
 * pendiente de que los revise: disciplina/organización priorizadas por sobre
 * creatividad, coherente con el rol (lectura del juego y posicionamiento
 * antes que último pase creativo).
 */
const POSITION_PSYCH_WEIGHTS: Record<PlayerPositionId, Record<PsychTraitKey, number>> = {
  goalkeeper: {
    discipline: 0.35,
    organizer: 0.3,
    competitiveness: 0.2,
    directness: 0.1,
    creativity: 0.05,
  },
  striker: {
    directness: 0.32,
    competitiveness: 0.28,
    creativity: 0.22,
    organizer: 0.05,
    discipline: 0.13,
  },
  winger: {
    directness: 0.28,
    creativity: 0.32,
    competitiveness: 0.18,
    organizer: 0.07,
    discipline: 0.15,
  },
  cam: {
    creativity: 0.3,
    organizer: 0.28,
    directness: 0.22,
    competitiveness: 0.1,
    discipline: 0.1,
  },
  cm: {
    organizer: 0.32,
    discipline: 0.26,
    directness: 0.12,
    creativity: 0.18,
    competitiveness: 0.12,
  },
  cdm: {
    discipline: 0.34,
    organizer: 0.3,
    competitiveness: 0.22,
    directness: 0.06,
    creativity: 0.08,
  },
  fullback: {
    discipline: 0.28,
    competitiveness: 0.24,
    organizer: 0.18,
    directness: 0.16,
    creativity: 0.14,
  },
  centerback: {
    discipline: 0.38,
    competitiveness: 0.26,
    organizer: 0.22,
    directness: 0.04,
    creativity: 0.1,
  },
}

const PHYSICAL_FIT_WEIGHT = 0.72
const PSYCH_FIT_WEIGHT = 0.28

const MIN_TESTS_FOR_SUGGESTION = 3

function countCompletedTests(tests: PhysicalTestState[]): number {
  return tests.filter((test) => test.score != null && test.score > 0).length
}

function getMeasuredStats(stats: PlayerStats): StatKey[] {
  return STAT_ORDER.filter((key) => stats[key] > 0)
}

function scorePosition(stats: PlayerStats, positionId: PlayerPositionId): number {
  const weights = POSITION_WEIGHTS[positionId]
  const measured = getMeasuredStats(stats)
  if (measured.length === 0) return 0

  let weightedSum = 0
  let weightTotal = 0
  for (const key of measured) {
    const weight = weights[key]
    weightedSum += stats[key] * weight
    weightTotal += weight
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0
}

function scorePositionPsych(
  traits: Record<PsychTraitKey, number>,
  positionId: PlayerPositionId,
): number {
  const weights = POSITION_PSYCH_WEIGHTS[positionId]
  let weightedSum = 0
  let weightTotal = 0

  for (const key of Object.keys(weights) as PsychTraitKey[]) {
    const weight = weights[key]
    weightedSum += traits[key] * weight
    weightTotal += weight
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0
}

function blendFitScore(physical: number, psych: number | null): number {
  if (psych == null) return physical
  return physical * PHYSICAL_FIT_WEIGHT + psych * PSYCH_FIT_WEIGHT
}

function getDominantStats(stats: PlayerStats, limit = 2): StatKey[] {
  return [...STAT_ORDER]
    .filter((key) => stats[key] > 0)
    .sort((a, b) => stats[b] - stats[a])
    .slice(0, limit)
}

function computeConfidence(
  completedTests: number,
  topScore: number,
  secondScore: number,
  psychInfluenced: boolean,
): number {
  const coverage = Math.min(1, completedTests / STAT_ORDER.length)
  const margin = Math.min(1, Math.max(0, (topScore - secondScore) / 25))
  const psychBoost = psychInfluenced ? 0.08 : 0
  const raw = coverage * 0.65 + margin * 0.35 + psychBoost
  return Math.round(Math.min(100, Math.max(0, raw * 100)))
}

export function suggestPlayerPosition(
  stats: PlayerStats,
  tests: PhysicalTestState[],
  psychTraits?: Record<PsychTraitKey, number> | null,
): PositionSuggestion | null {
  const completedTests = countCompletedTests(tests)
  if (completedTests === 0) return null

  const psychInfluenced = psychTraits != null

  const ranked = (Object.keys(POSITION_WEIGHTS) as PlayerPositionId[])
    .map((positionId) => {
      const physical = scorePosition(stats, positionId)
      const psych = psychTraits ? scorePositionPsych(psychTraits, positionId) : null
      return {
        positionId,
        fitScore: blendFitScore(physical, psych),
      }
    })
    .sort((a, b) => b.fitScore - a.fitScore)

  const best = ranked[0]
  const second = ranked[1]
  if (!best) return null

  const confidence = computeConfidence(
    completedTests,
    best.fitScore,
    second?.fitScore ?? 0,
    psychInfluenced,
  )

  return {
    positionId: best.positionId,
    labelKey: POSITION_LABEL_KEYS[best.positionId],
    confidence,
    completedTests,
    isReady: completedTests >= MIN_TESTS_FOR_SUGGESTION,
    dominantStats: getDominantStats(stats),
    fitScore: Math.round(best.fitScore),
    psychInfluenced,
  }
}
