/**
 * Estado de pendientes (Fase B) como store puro, sin React: se testea con
 * jest sin renderizar nada y PendingContext solo lo expone al árbol.
 *
 * Reglas:
 *  - `refresh()` deduplica: las llamadas concurrentes comparten la promesa en
 *    vuelo. Con throttle de 60 s salvo `force` (arranque, push, resolver un
 *    pendiente): la vuelta a primer plano es el único disparador que respeta
 *    el throttle. Sin polling: nadie llama a refresh por tiempo.
 *  - Si el endpoint falla, se conservan las cifras anteriores y no hay estado
 *    de error: el punto simplemente no aparece (o queda como estaba).
 *  - `bump(kind, delta)` es optimista y nunca baja de 0; siempre va seguido
 *    de un `refresh({ force: true })` por parte de quien lo llama, para
 *    corregir con el dato real.
 */
import { PENDING_KINDS, type PendingCountsApiDto, type PendingKind } from "@/services/api/types"

export type PendingCounts = PendingCountsApiDto

export interface PendingSnapshot {
  counts: PendingCounts
  total: number
  /** Epoch ms de la última respuesta ok; 0 si nunca se sincronizó. */
  lastSyncedAt: number
}

export const EMPTY_PENDING_COUNTS: PendingCounts = {
  friendRequests: 0,
  groupFriendRequests: 0,
  matchChallenges: 0,
  guestApplications: 0,
  groupInvites: 0,
}

export const PENDING_THROTTLE_MS = 60_000

export function isPendingKind(value: unknown): value is PendingKind {
  return typeof value === "string" && (PENDING_KINDS as readonly string[]).includes(value)
}

/** Claves desconocidas (backend más nuevo que la app) se ignoran; las que faltan quedan en 0. */
function sanitize(raw: Partial<Record<string, unknown>>): PendingCounts {
  const counts: PendingCounts = { ...EMPTY_PENDING_COUNTS }
  for (const kind of PENDING_KINDS) {
    const value = raw[kind]
    counts[kind] = typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0
  }
  return counts
}

function sum(counts: PendingCounts): number {
  return PENDING_KINDS.reduce((acc, kind) => acc + counts[kind], 0)
}

export type PendingFetch = () => Promise<
  { kind: "ok"; counts: PendingCountsApiDto } | { kind: string }
>

export interface PendingStoreOptions {
  fetch: PendingFetch
  now?: () => number
  throttleMs?: number
}

export function createPendingStore({
  fetch,
  now = Date.now,
  throttleMs = PENDING_THROTTLE_MS,
}: PendingStoreOptions) {
  let snapshot: PendingSnapshot = { counts: EMPTY_PENDING_COUNTS, total: 0, lastSyncedAt: 0 }
  let inFlight: Promise<void> | null = null
  /** Sube en cada reset(): una respuesta de la sesión anterior que llegue tarde se descarta. */
  let generation = 0
  const listeners = new Set<() => void>()

  const emit = () => listeners.forEach((listener) => listener())

  const setCounts = (counts: PendingCounts, syncedAt?: number) => {
    snapshot = {
      counts,
      total: sum(counts),
      lastSyncedAt: syncedAt ?? snapshot.lastSyncedAt,
    }
    emit()
  }

  const refresh = (options?: { force?: boolean }): Promise<void> => {
    if (inFlight) return inFlight
    const force = options?.force === true
    if (!force && snapshot.lastSyncedAt > 0 && now() - snapshot.lastSyncedAt < throttleMs) {
      return Promise.resolve()
    }
    const startedIn = generation
    const request = fetch()
      .then((result) => {
        if (startedIn !== generation) return // hubo reset() (logout) mientras volaba
        if (result.kind === "ok" && "counts" in result) setCounts(sanitize(result.counts), now())
        // Error: se conserva lo anterior, sin estado de error (el punto no aparece).
      })
      .catch(() => undefined)
      .finally(() => {
        if (inFlight === request) inFlight = null
      })
    inFlight = request
    return request
  }

  const bump = (kind: PendingKind, delta: number) => {
    if (!isPendingKind(kind) || !Number.isFinite(delta) || delta === 0) return
    const next = Math.max(0, snapshot.counts[kind] + delta)
    if (next === snapshot.counts[kind]) return
    setCounts({ ...snapshot.counts, [kind]: next })
  }

  const reset = () => {
    generation += 1
    inFlight = null
    setCounts(EMPTY_PENDING_COUNTS, 0)
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe,
    refresh,
    bump,
    reset,
  }
}

export type PendingStore = ReturnType<typeof createPendingStore>
