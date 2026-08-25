import { useCallback, useEffect, useRef, useState } from "react"

import { api, type TournamentApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

/** Campeonatos Elite Forge activos — visibles para cualquier jugador logueado. */
export function useTournaments() {
  const [tournaments, setTournaments] = useState<TournamentApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const reload = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setRefreshing(true)
    setError(null)

    const result = await api.listActiveTournaments()
    if (result.kind === "ok") {
      setTournaments(result.tournaments)
    } else {
      setError(result)
    }

    setRefreshing(false)
    setLoading(false)
    inFlightRef.current = false
  }, [])

  useEffect(() => {
    reload()
    // Solo en el montaje inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { tournaments, loading, refreshing, error, reload }
}
