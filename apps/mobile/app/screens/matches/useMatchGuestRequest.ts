import { useCallback, useEffect, useState } from "react"

import type { PlayerPositionId } from "@/data/suggestPlayerPosition"
import { api, type MatchGuestApplicationApiDto, type MatchGuestRequestApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

/**
 * Ciclo de vida del comodín de UN partido (Fase 11): la solicitud vigente
 * (si la hay) y, cuando está abierta, sus postulaciones — solo se piden si
 * `canManage` (líder/vice), igual que useMatchDetail delega el permiso al
 * backend y esta pantalla solo decide qué mostrar con el resultado.
 */
export function useMatchGuestRequest(matchId: string, canManage: boolean) {
  const [request, setRequest] = useState<MatchGuestRequestApiDto | null>(null)
  const [applications, setApplications] = useState<MatchGuestApplicationApiDto[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await api.getGuestRequestForMatch(matchId)
    setRequest(result.kind === "ok" ? result.request : null)
    setLoading(false)
  }, [matchId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isOpen = request?.status === "open"

  const refreshApplications = useCallback(async () => {
    if (!request || request.status !== "open" || !canManage) {
      setApplications([])
      return
    }
    const result = await api.listGuestApplications(request.id)
    if (result.kind === "ok") setApplications(result.applications)
  }, [request, canManage])

  useEffect(() => {
    refreshApplications()
  }, [refreshApplications])

  const open = useCallback(
    async (payload: {
      requestedPosition?: PlayerPositionId
      radiusKm?: number
    }): Promise<{ kind: "ok" } | GeneralApiProblem> => {
      const result = await api.openGuestRequest(matchId, payload)
      if (result.kind === "ok") {
        setRequest(result.request)
        return { kind: "ok" }
      }
      return result
    },
    [matchId],
  )

  const cancel = useCallback(async (): Promise<{ kind: "ok" } | GeneralApiProblem> => {
    const result = await api.cancelGuestRequest(matchId)
    if (result.kind === "ok") await refresh()
    return result
  }, [matchId, refresh])

  const accept = useCallback(
    async (applicationId: string): Promise<{ kind: "ok" } | GeneralApiProblem> => {
      const result = await api.acceptGuestApplication(applicationId)
      if (result.kind === "ok") {
        await refresh()
      }
      return result
    },
    [refresh],
  )

  const reject = useCallback(
    async (applicationId: string): Promise<{ kind: "ok" } | GeneralApiProblem> => {
      const result = await api.rejectGuestApplication(applicationId)
      if (result.kind === "ok") await refreshApplications()
      return result
    },
    [refreshApplications],
  )

  return {
    request,
    isOpen,
    applications,
    loading,
    refresh,
    open,
    cancel,
    accept,
    reject,
  }
}
