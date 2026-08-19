import { useCallback, useEffect, useRef, useState } from "react"

import { api, type GroupDetailApiDto, type GroupSummaryApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

/** Lista "Mis grupos" — sin paginación, no se espera que un jugador esté en decenas de grupos. */
export function useGroups() {
  const [groups, setGroups] = useState<GroupSummaryApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setRefreshing(true)
    setError(null)

    const result = await api.listMyGroups()
    if (result.kind === "ok") {
      setGroups(result.groups)
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

  const createGroup = useCallback(async (name: string): Promise<GroupDetailApiDto | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const result = await api.createGroup(trimmed)
    if (result.kind !== "ok") return null

    setGroups((prev) => [
      {
        id: result.group.id,
        name: result.group.name,
        photoBase64: result.group.photoBase64,
        creatorId: result.group.creatorId,
        role: "creator",
        memberCount: result.group.members.length,
        createdAt: result.group.createdAt,
      },
      ...prev,
    ])
    return result.group
  }, [])

  return { groups, loading, refreshing, error, refresh, createGroup }
}
