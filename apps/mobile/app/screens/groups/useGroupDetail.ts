import { useCallback, useEffect, useRef, useState } from "react"

import { api, type GroupDetailApiDto, type GroupInvitationApiDto } from "@/services/api"
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

  // ── Invitaciones (2026-09-11): reemplazan al alta directa de miembros. ──
  const [invitations, setInvitations] = useState<GroupInvitationApiDto[]>([])

  /** Solo tiene sentido para creador/admin (el backend responde 403 al resto). */
  const loadInvitations = useCallback(async () => {
    const result = await api.listGroupInvitations(groupId)
    if (result.kind === "ok") setInvitations(result.invitations)
  }, [groupId])

  const invite = useCallback(
    async (identifier: {
      userId?: string
      email?: string
    }): Promise<{ kind: "ok"; invitation: GroupInvitationApiDto } | GeneralApiProblem> => {
      const result = await api.inviteToGroup(groupId, identifier)
      if (result.kind === "ok") {
        setInvitations((prev) => [
          result.invitation,
          ...prev.filter((inv) => inv.id !== result.invitation.id),
        ])
      }
      return result
    },
    [groupId],
  )

  const cancelInvitation = useCallback(
    async (invitationId: string): Promise<SimpleResult> => {
      const result = await api.cancelGroupInvitation(groupId, invitationId)
      if (result.kind === "ok" || result.kind === "not-found") {
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
      }
      return result.kind === "ok" ? { kind: "ok" } : result
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
      municipalityCode?: string | null
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
    invite,
    invitations,
    loadInvitations,
    cancelInvitation,
    updateMemberRole,
    removeMember,
    deleteGroup,
    updateGroup,
  }
}
