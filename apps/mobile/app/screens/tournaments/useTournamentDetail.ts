import { useCallback, useEffect, useRef, useState } from "react"

import { api, type TournamentApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

/** Detalle público de un campeonato — solo lectura para cualquier jugador. */
export function useTournamentDetail(tournamentId: string) {
  const [tournament, setTournament] = useState<TournamentApiDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setError(null)

    const result = await api.getTournamentPublic(tournamentId)
    if (result.kind === "ok") {
      setTournament(result.tournament)
    } else {
      setError(result)
    }

    setLoading(false)
    inFlightRef.current = false
  }, [tournamentId])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId])

  /** El enroll ya devuelve el torneo actualizado — se aplica directo, sin otro round-trip. */
  const applyTournament = useCallback((next: TournamentApiDto) => {
    setTournament(next)
  }, [])

  return { tournament, loading, error, refresh, applyTournament }
}
