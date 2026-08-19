import { useCallback, useEffect, useRef, useState } from "react"

import { api, type MyReservationApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

type CreateResult = { kind: "ok"; reservation: MyReservationApiDto } | GeneralApiProblem

/** "Mis reservas" — todas, sin importar el estado. El backend ya las ordena por fecha. */
export function useReservations() {
  const [reservations, setReservations] = useState<MyReservationApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const reload = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setRefreshing(true)
    setError(null)

    const result = await api.listMyReservations()
    if (result.kind === "ok") {
      setReservations(result.reservations)
    } else {
      setError(result)
    }

    setRefreshing(false)
    setLoading(false)
    inFlightRef.current = false
  }, [])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const create = useCallback(
    async (payload: {
      venueId: string
      startsAt: string
      endsAt: string
      notes?: string
      matchId?: string
    }): Promise<CreateResult> => {
      const result = await api.createReservation(payload)
      if (result.kind === "ok") {
        setReservations((prev) => [result.reservation, ...prev])
      }
      return result
    },
    [],
  )

  return { reservations, loading, refreshing, error, reload, create }
}
