import { useCallback, useEffect, useState } from "react"

import type { PlayerPositionId } from "@/data/suggestPlayerPosition"
import { api } from "@/services/api"
import {
  createDefaultProfile,
  loadPlayerProfile,
  savePlayerProfile,
  type PlayerProfileData,
  type PsychTestResult,
} from "@/utils/playerProfileStorage"

/** Best-effort: ver nota equivalente en useProfileStats.ts (syncPhysicalTestResultToBackend). */
function syncPsychAssessmentToBackend(result: PsychTestResult): void {
  if (!result.traits) return // sin traits no hay respuestas completas que enviar
  api
    .savePsychAssessment({
      answers: result.answers,
      teamworkScore: result.teamworkScore,
      onFieldScore: result.onFieldScore,
      overallScore: result.overallScore,
      traits: result.traits,
    })
    .then((response) => {
      if (response.kind !== "ok" && __DEV__) {
        console.warn("[profileStats] sync de test psicológico falló:", response.kind)
      }
    })
    .catch((error) => {
      if (__DEV__) console.warn("[profileStats] sync de test psicológico lanzó excepción:", error)
    })
}

function syncFavoritePositionToBackend(favoritePositionId: PlayerPositionId | null): void {
  api
    .updateFavoritePosition(favoritePositionId)
    .then((response) => {
      if (response.kind !== "ok" && __DEV__) {
        console.warn("[profileStats] sync de posición favorita falló:", response.kind)
      }
    })
    .catch((error) => {
      if (__DEV__) console.warn("[profileStats] sync de posición favorita lanzó excepción:", error)
    })
}

function mergeProfile(
  stored: PlayerProfileData | undefined,
  authEmail?: string,
): PlayerProfileData {
  const defaults = createDefaultProfile(authEmail)
  if (!stored) return defaults
  return { ...defaults, ...stored }
}

export function usePlayerProfile(userKey: string, authEmail?: string) {
  const [profile, setProfile] = useState<PlayerProfileData>(() => createDefaultProfile(authEmail))
  const [psychTest, setPsychTest] = useState<PsychTestResult | undefined>()
  const [hydrated, setHydrated] = useState(false)

  const reload = useCallback(() => {
    const snapshot = loadPlayerProfile(userKey)
    setProfile(mergeProfile(snapshot?.profile, authEmail))
    setPsychTest(snapshot?.psychTest)
  }, [authEmail, userKey])

  useEffect(() => {
    reload()
    setHydrated(true)
  }, [reload])

  const persist = useCallback(
    (nextProfile: PlayerProfileData, nextPsychTest?: PsychTestResult) => {
      savePlayerProfile(userKey, {
        profile: nextProfile,
        psychTest: nextPsychTest,
      })
    },
    [userKey],
  )

  const updateProfile = useCallback(
    (patch: Partial<PlayerProfileData>) => {
      setProfile((current) => {
        const next = { ...current, ...patch }
        persist(next, psychTest)
        return next
      })
    },
    [persist, psychTest],
  )

  const saveFullProfile = useCallback(
    (nextProfile: PlayerProfileData) => {
      const positionChanged = nextProfile.favoritePositionId !== profile.favoritePositionId
      setProfile(nextProfile)
      persist(nextProfile, psychTest)
      if (positionChanged) {
        syncFavoritePositionToBackend(nextProfile.favoritePositionId)
      }
    },
    [persist, profile.favoritePositionId, psychTest],
  )

  const setFavoritePosition = useCallback(
    (favoritePositionId: PlayerPositionId | null) => {
      updateProfile({ favoritePositionId })
      syncFavoritePositionToBackend(favoritePositionId)
    },
    [updateProfile],
  )

  const savePsychTestResult = useCallback(
    (result: PsychTestResult) => {
      setPsychTest(result)
      persist(profile, result)
      syncPsychAssessmentToBackend(result)
    },
    [persist, profile],
  )

  const resetPsychTest = useCallback(() => {
    setPsychTest(undefined)
    persist(profile, undefined)
  }, [persist, profile])

  return {
    profile,
    psychTest,
    updateProfile,
    saveFullProfile,
    setFavoritePosition,
    savePsychTestResult,
    resetPsychTest,
    reload,
    hydrated,
  }
}
