/**
 * Pendientes del usuario (Fase B): punto en el botón hamburguesa y en el ítem
 * del drawer. Vive al lado de AuthProvider y llega a los componentes por
 * contexto — FeedScreen y FeedNavbar no se enteran.
 *
 * Cuándo se refresca (sin polling):
 *  - arranque / login: force
 *  - vuelta a primer plano: con throttle de 60 s
 *  - push recibido con la app abierta: bump optimista si trae `pending`, y force
 *  - tap en un push: force
 *  - el usuario resuelve un pendiente (useFriends, GroupFriends, MatchDetail): bump -1 + force
 * Sin sesión no se llama al endpoint y el estado vuelve a cero.
 */
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react"
import { AppState } from "react-native"

import { api } from "@/services/api"
import type { PendingKind } from "@/services/api/types"
import { addPushReceivedListener, addPushResponseListener } from "@/utils/pushNotifications"

import { useAuth } from "./AuthContext"
import {
  createPendingStore,
  EMPTY_PENDING_COUNTS,
  isPendingKind,
  type PendingCounts,
  type PendingStore,
} from "./pendingStore"

export interface PendingContextValue {
  counts: PendingCounts
  total: number
  /** `force` salta el throttle. Nunca rechaza. */
  refresh: (options?: { force?: boolean }) => Promise<void>
  /** Ajuste optimista (+1 push recibido, −1 pendiente resuelto); seguir con refresh({ force: true }). */
  bump: (kind: PendingKind, delta: number) => void
}

const noop = async () => undefined

/** Valor por defecto: componentes fuera del provider (showroom, tests) ven cero y no rompen. */
const DEFAULT_VALUE: PendingContextValue = {
  counts: EMPTY_PENDING_COUNTS,
  total: 0,
  refresh: noop,
  bump: () => undefined,
}

const PendingContext = createContext<PendingContextValue>(DEFAULT_VALUE)

function pendingKindOf(data: unknown): PendingKind | null {
  if (!data || typeof data !== "object") return null
  const kind = (data as Record<string, unknown>).pending
  return isPendingKind(kind) ? kind : null
}

export function PendingProvider({ children }: PropsWithChildren) {
  const { authToken } = useAuth()
  const storeRef = useRef<PendingStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = createPendingStore({ fetch: () => api.getPendingCounts() })
  }
  const store = storeRef.current

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  useEffect(() => {
    if (!authToken) {
      store.reset()
      return
    }

    void store.refresh({ force: true })

    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void store.refresh()
    })
    const received = addPushReceivedListener((data) => {
      const kind = pendingKindOf(data)
      if (kind) store.bump(kind, 1)
      void store.refresh({ force: true })
    })
    const tapped = addPushResponseListener(() => {
      void store.refresh({ force: true })
    })

    return () => {
      appState.remove()
      received.remove()
      tapped.remove()
    }
  }, [authToken, store])

  const refresh = useCallback((options?: { force?: boolean }) => store.refresh(options), [store])
  const bump = useCallback((kind: PendingKind, delta: number) => store.bump(kind, delta), [store])

  const value = useMemo<PendingContextValue>(
    () => ({ counts: snapshot.counts, total: snapshot.total, refresh, bump }),
    [snapshot, refresh, bump],
  )

  return <PendingContext.Provider value={value}>{children}</PendingContext.Provider>
}

export function usePending(): PendingContextValue {
  return useContext(PendingContext)
}
