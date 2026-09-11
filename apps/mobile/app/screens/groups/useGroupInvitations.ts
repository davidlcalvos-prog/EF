import { useCallback, useEffect, useRef, useState } from "react"

import { usePending } from "@/context/PendingContext"
import { api, type GroupInvitationApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

type SimpleResult = { kind: "ok" } | GeneralApiProblem

/**
 * Mis invitaciones a grupo pendientes (2026-09-11): las que ME mandaron y
 * todavía no respondí. Aceptar/rechazar actualizan la lista local sin
 * recargar (mismo criterio que useFriends) y bajan el punto naranja del
 * drawer al instante (`pending.bump`) corrigiendo después con el dato real.
 */
export function useGroupInvitations() {
  const pending = usePending()
  const [invitations, setInvitations] = useState<GroupInvitationApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const inFlightRef = useRef(false)

  const reload = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    const result = await api.listMyGroupInvitations()
    // Si falla, se conserva lo anterior: el bloque no bloquea ni muestra error
    // (la lista de grupos de abajo ya tiene su propio manejo de errores).
    if (result.kind === "ok") setInvitations(result.invitations)
    setLoading(false)
    inFlightRef.current = false
  }, [])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const settle = useCallback(
    (invitationId: string) => {
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
      pending.bump("groupInvites", -1)
      void pending.refresh({ force: true })
    },
    [pending],
  )

  const accept = useCallback(
    async (invitation: GroupInvitationApiDto): Promise<SimpleResult> => {
      const result = await api.acceptGroupInvitation(invitation.id)
      // 404 (grupo borrado) y 409 (ya respondida / ya miembro) también la
      // sacan de la lista: ya no hay nada que responder.
      if (result.kind === "ok" || result.kind === "not-found" || result.kind === "conflict") {
        settle(invitation.id)
      }
      return result.kind === "ok" ? { kind: "ok" } : result
    },
    [settle],
  )

  const decline = useCallback(
    async (invitation: GroupInvitationApiDto): Promise<SimpleResult> => {
      const result = await api.declineGroupInvitation(invitation.id)
      if (result.kind === "ok" || result.kind === "not-found" || result.kind === "conflict") {
        settle(invitation.id)
      }
      return result
    },
    [settle],
  )

  return { invitations, loading, reload, accept, decline }
}
