import { useCallback, useEffect, useState } from "react"

import { api, type MatchGuestRequestApiDto } from "@/services/api"

/**
 * "Cerca de mí" (Fase 11) — vacantes de comodín dentro del radio de cada
 * solicitud, medido desde la zona guardada del usuario. [] si no hay zona
 * cargada; la pantalla decide cómo invitar a cargarla.
 */
export function useNearbyGuestRequests() {
  const [requests, setRequests] = useState<MatchGuestRequestApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(false)

    const result = await api.listNearbyGuestRequests()
    if (result.kind === "ok") {
      setRequests(result.requests)
    } else {
      setError(true)
    }

    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  const refresh = useCallback(() => load(true), [load])

  const apply = useCallback(async (requestId: string) => {
    const result = await api.applyToGuestRequest(requestId)
    if (result.kind === "ok") {
      const updated = result.request
      setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)))
    }
    return result
  }, [])

  return { requests, loading, refreshing, error, refresh, apply }
}
