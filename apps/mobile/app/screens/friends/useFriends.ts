import { useCallback, useEffect, useRef, useState } from "react"

import { api, type UserFriendshipApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

type SimpleResult = { kind: "ok" } | GeneralApiProblem

/**
 * Amistades del usuario autenticado (Fase 10): tres listas del backend
 * (aceptadas / recibidas / enviadas). Tras aceptar, rechazar o cancelar se
 * actualiza el estado local sin recargar todo (pedido explícito de David);
 * reload queda para el pull-to-refresh y el primer render.
 */
export function useFriends() {
  const [friends, setFriends] = useState<UserFriendshipApiDto[]>([])
  const [incoming, setIncoming] = useState<UserFriendshipApiDto[]>([])
  const [outgoing, setOutgoing] = useState<UserFriendshipApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const reload = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setError(null)

    const [acceptedResult, receivedResult, sentResult] = await Promise.all([
      api.listFriendships("accepted"),
      api.listFriendships("pending_received"),
      api.listFriendships("pending_sent"),
    ])

    if (acceptedResult.kind === "ok" && receivedResult.kind === "ok" && sentResult.kind === "ok") {
      setFriends(acceptedResult.friendships)
      setIncoming(receivedResult.friendships)
      setOutgoing(sentResult.friendships)
    } else {
      const firstProblem = [acceptedResult, receivedResult, sentResult].find(
        (r) => r.kind !== "ok",
      ) as GeneralApiProblem
      setError(firstProblem)
    }

    setLoading(false)
    inFlightRef.current = false
  }, [])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const accept = useCallback(async (friendship: UserFriendshipApiDto): Promise<SimpleResult> => {
    const result = await api.acceptFriendship(friendship.id)
    if (result.kind === "ok") {
      setIncoming((prev) => prev.filter((f) => f.id !== friendship.id))
      setFriends((prev) => [result.friendship, ...prev])
      return { kind: "ok" }
    }
    return result
  }, [])

  /** Rechazar (recibida), cancelar (enviada) o eliminar (aceptada). */
  const remove = useCallback(async (friendship: UserFriendshipApiDto): Promise<SimpleResult> => {
    const result = await api.removeFriendship(friendship.id)
    if (result.kind === "ok") {
      setFriends((prev) => prev.filter((f) => f.id !== friendship.id))
      setIncoming((prev) => prev.filter((f) => f.id !== friendship.id))
      setOutgoing((prev) => prev.filter((f) => f.id !== friendship.id))
    }
    return result
  }, [])

  return { friends, incoming, outgoing, loading, error, reload, accept, remove }
}
