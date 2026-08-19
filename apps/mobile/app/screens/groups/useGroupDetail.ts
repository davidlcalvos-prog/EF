import { useCallback, useEffect, useRef, useState } from "react"

import { api, type GroupDetailApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

type GroupResult = { kind: "ok"; group: GroupDetailApiDto } | GeneralApiProblem
type SimpleResult = { kind: "ok" } | GeneralApiProblem

/**
 * Detalle de un grupo. Las acciones devuelven el resultado crudo del cliente API
 * (incluye `kind: 'forbidden' | 'conflict' | 'not-found' | ...`) para que la pantalla
 * decida qué mensaje mostrar — la fuente de verdad del permiso es siempre el backend.
 */
export function useGroupDetail(groupId: string) {
  const [group, setGroup] = useState<GroupDetailApiDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setError(null)

    const result = await api.getGroupDetail(groupId)
    if (result.kind === "ok") {
      setGroup(result.group)
    } else {
      setError(result)
    }

    setLoading(false)
    inFlightRef.current = false
  }, [groupId])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  const addMember = useCallback(
    async (identifier: { userId?: string; email?: string }): Promise<GroupResult> => {
      const result = await api.addGroupMember(groupId, identifier)
      if (result.kind === "ok") setGroup(result.group)
      return result
    },
    [groupId],
  )

  const updateMemberRole = useCallback(
    async (userId: string, role: "admin" | "member"): Promise<GroupResult> => {
      const result = await api.updateGroupMemberRole(groupId, userId, role)
      if (result.kind === "ok") setGroup(result.group)
      return result
    },
    [groupId],
  )

  const removeMember = useCallback(
    async (userId: string): Promise<SimpleResult> => {
      const result = await api.removeGroupMember(groupId, userId)
      if (result.kind === "ok") {
        setGroup((prev) =>
          prev ? { ...prev, members: prev.members.filter((m) => m.userId !== userId) } : prev,
        )
      }
      return result
    },
    [groupId],
  )

  const deleteGroup = useCallback(async (): Promise<SimpleResult> => {
    return api.deleteGroup(groupId)
  }, [groupId])

  const updateGroup = useCallback(
    async (payload: {
      name: string
      photoBase64?: string
      removePhoto?: boolean
    }): Promise<GroupResult> => {
      const result = await api.updateGroup(groupId, payload)
      if (result.kind === "ok") setGroup(result.group)
      return result
    },
    [groupId],
  )

  return {
    group,
    loading,
    error,
    refresh,
    addMember,
    updateMemberRole,
    removeMember,
    deleteGroup,
    updateGroup,
  }
}
