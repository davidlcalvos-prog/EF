import { useCallback, useEffect, useRef, useState } from "react"

import { api, type MatchSummaryApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

/**
 * Lista de partidos — "mis partidos" (todos mis grupos, sin groupId) o los
 * de un grupo específico (con groupId). Sin paginación, mismo criterio que Grupos.
 */
export function useMatches(groupId?: string) {
  const [matches, setMatches] = useState<MatchSummaryApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setRefreshing(true)
    setError(null)

    const result = groupId ? await api.listGroupMatches(groupId) : await api.listMyMatches()
    if (result.kind === "ok") {
      setMatches(result.matches)
    } else {
      setError(result)
    }

    setRefreshing(false)
    setLoading(false)
    inFlightRef.current = false
  }, [groupId])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  return { matches, loading, refreshing, error, refresh }
}
