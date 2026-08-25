import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { api, type GroupFriendshipApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

type FriendshipResult = { kind: "ok"; friendship: GroupFriendshipApiDto } | GeneralApiProblem
type SimpleResult = { kind: "ok" } | GeneralApiProblem

/** El grupo "del otro lado" de una amistad, visto desde `groupId`. */
export function getOtherGroup(friendship: GroupFriendshipApiDto, groupId: string) {
  return friendship.groupAId === groupId
    ? {
        id: friendship.groupBId,
        name: friendship.groupBName,
        photoBase64: friendship.groupBPhotoBase64,
      }
    : {
        id: friendship.groupAId,
        name: friendship.groupAName,
        photoBase64: friendship.groupAPhotoBase64,
      }
}

/**
 * Amistades de un grupo — una sola llamada a listGroupFriendships, derivadas
 * client-side en amigos / solicitudes entrantes / solicitudes salientes según
 * requestedByGroupId. La fuente de verdad del permiso (creator/admin) sigue
 * siendo el backend; esto solo decide qué mostrar.
 */
export function useGroupFriendships(groupId: string) {
  const [friendships, setFriendships] = useState<GroupFriendshipApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const reload = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setError(null)

    const result = await api.listGroupFriendships(groupId)
    if (result.kind === "ok") {
      setFriendships(result.friendships)
    } else {
      setError(result)
    }

    setLoading(false)
    inFlightRef.current = false
  }, [groupId])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  const friends = useMemo(() => friendships.filter((f) => f.status === "accepted"), [friendships])
  const incomingRequests = useMemo(
    () => friendships.filter((f) => f.status === "pending" && f.requestedByGroupId !== groupId),
    [friendships, groupId],
  )
  const outgoingRequests = useMemo(
    () => friendships.filter((f) => f.status === "pending" && f.requestedByGroupId === groupId),
    [friendships, groupId],
  )

  const request = useCallback(
    async (targetGroupId: string): Promise<FriendshipResult> => {
      const result = await api.requestGroupFriendship(groupId, targetGroupId)
      if (result.kind === "ok") await reload()
      return result
    },
    [groupId, reload],
  )

  const accept = useCallback(
    async (friendshipId: string): Promise<FriendshipResult> => {
      const result = await api.acceptGroupFriendship(friendshipId)
      if (result.kind === "ok") await reload()
      return result
    },
    [reload],
  )

  const remove = useCallback(
    async (friendshipId: string): Promise<SimpleResult> => {
      const result = await api.removeGroupFriendship(friendshipId)
      if (result.kind === "ok") await reload()
      return result
    },
    [reload],
  )

  return {
    friendships,
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    reload,
    request,
    accept,
    remove,
  }
}
