import { useCallback, useEffect, useRef, useState } from "react"

import { api, type GlobalRankingsApiResponse } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

/** Rankings globales — mismo patrón que useGroups/useReservations. */
export function useRankings() {
  const [rankings, setRankings] = useState<GlobalRankingsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setRefreshing(true)
    setError(null)

    const result = await api.getGlobalRankings()
    if (result.kind === "ok") {
      setRankings(result.rankings)
    } else {
      setError(result)
    }

    setRefreshing(false)
    setLoading(false)
    inFlightRef.current = false
  }, [])

  useEffect(() => {
    refresh()
    // Solo en el montaje inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { rankings, loading, refreshing, error, refresh }
}
