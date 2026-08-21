import { useCallback, useEffect, useRef, useState } from "react"

import { api, type MatchApiDto, type TeamAssignmentWarningApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

type MatchResult = { kind: "ok"; match: MatchApiDto } | GeneralApiProblem
type RandomizeTeamsResult =
  | { kind: "ok"; match: MatchApiDto; warnings: TeamAssignmentWarningApiDto[] }
  | { kind: "not-full" }
  | { kind: "wrong-status" }
  | GeneralApiProblem

/**
 * Detalle de un partido. Las acciones devuelven el resultado crudo del cliente
 * API para que la pantalla decida qué mensaje mostrar — el backend sigue siendo
 * la fuente de verdad del permiso, mismo criterio que useGroupDetail.
 */
export function useMatchDetail(matchId: string) {
  const [match, setMatch] = useState<MatchApiDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setError(null)

    const result = await api.getMatchDetail(matchId)
    if (result.kind === "ok") {
      setMatch(result.match)
    } else {
      setError(result)
    }

    setLoading(false)
    inFlightRef.current = false
  }, [matchId])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  const join = useCallback(async (): Promise<MatchResult> => {
    const result = await api.joinMatch(matchId)
    if (result.kind === "ok") setMatch(result.match)
    return result
  }, [matchId])

  const leave = useCallback(async (): Promise<MatchResult> => {
    const result = await api.leaveMatch(matchId)
    if (result.kind === "ok") setMatch(result.match)
    return result
  }, [matchId])

  const updateStatus = useCallback(
    async (status: "played" | "cancelled"): Promise<MatchResult> => {
      const result = await api.updateMatchStatus(matchId, status)
      if (result.kind === "ok") setMatch(result.match)
      return result
    },
    [matchId],
  )

  const accept = useCallback(async (): Promise<MatchResult> => {
    const result = await api.acceptMatch(matchId)
    if (result.kind === "ok") setMatch(result.match)
    return result
  }, [matchId])

  const reject = useCallback(async (): Promise<MatchResult> => {
    const result = await api.rejectMatch(matchId)
    if (result.kind === "ok") setMatch(result.match)
    return result
  }, [matchId])

  const randomizeTeams = useCallback(async (): Promise<RandomizeTeamsResult> => {
    const result = await api.randomizeTeams(matchId)
    if (result.kind === "ok") setMatch(result.match)
    return result
  }, [matchId])

  return {
    match,
    loading,
    error,
    refresh,
    join,
    leave,
    updateStatus,
    accept,
    reject,
    randomizeTeams,
  }
}
