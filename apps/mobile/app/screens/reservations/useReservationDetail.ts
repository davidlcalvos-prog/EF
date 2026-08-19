import { useCallback, useEffect, useRef, useState } from "react"

import { api, type MyReservationApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

type ReservationResult = { kind: "ok"; reservation: MyReservationApiDto } | GeneralApiProblem

/**
 * Detalle de una reserva propia. cancel() devuelve el resultado crudo del
 * cliente API para que la pantalla decida el mensaje — mismo criterio que
 * useMatchDetail (el backend sigue siendo la fuente de verdad del permiso).
 */
export function useReservationDetail(reservationId: string) {
  const [reservation, setReservation] = useState<MyReservationApiDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setError(null)

    const result = await api.getReservation(reservationId)
    if (result.kind === "ok") {
      setReservation(result.reservation)
    } else {
      setError(result)
    }

    setLoading(false)
    inFlightRef.current = false
  }, [reservationId])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId])

  const cancel = useCallback(async (): Promise<ReservationResult> => {
    const result = await api.cancelReservation(reservationId)
    if (result.kind === "ok") setReservation(result.reservation)
    return result
  }, [reservationId])

  return { reservation, loading, error, refresh, cancel }
}
