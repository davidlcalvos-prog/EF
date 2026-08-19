import { useCallback, useEffect, useRef, useState } from "react"

import { api, type PublicVenueApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

/** Lista pública de canchas — sin paginación ni filtros en esta fase. */
export function useVenues() {
  const [venues, setVenues] = useState<PublicVenueApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const reload = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setError(null)

    const result = await api.listVenues()
    if (result.kind === "ok") {
      setVenues(result.venues)
    } else {
      setError(result)
    }

    setLoading(false)
    inFlightRef.current = false
  }, [])

  useEffect(() => {
    reload()
    // Solo en el montaje inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { venues, loading, error, reload }
}
