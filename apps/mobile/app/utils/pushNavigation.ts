/**
 * Despachador ÚNICO de navegación desde una notificación push (Fase A).
 *
 * El backend declara el destino en `data` (contrato PushData, ver
 * services/api/types.ts); acá solo se valida y se navega:
 *
 *  1. `resolvePushTarget(data)` — acepta el contrato nuevo (`v: 1` + `screen`)
 *     o el payload viejo (sin `v`: se traduce con LEGACY_PUSH_MAP mientras
 *     convivan builds y backend de distintas versiones). `screen` se valida
 *     contra PUSH_SCREENS (lista blanca): un valor que no esté ahí NO navega,
 *     venga de donde venga.
 *  2. `dispatchPushNavigation(target)` — navega si el contenedor está listo
 *     y la ruta existe (con sesión); si no, deja el destino en cola.
 *  3. `flushPendingPushNavigation()` — consume la cola. La llaman
 *     AppNavigator (onReady del NavigationContainer) y AppStack cuando la
 *     rama autenticada se monta (login después del tap).
 *
 * Cola en memoria a propósito (no MMKV): una notificación de hace días no
 * debe secuestrar el primer arranque de otra sesión. Se guarda solo el
 * último destino.
 *
 * Cómo agregar una notificación nueva: si su `screen` ya está en
 * PUSH_SCREENS, NO hay que tocar este archivo — solo el `sendToUser` del
 * backend. Si es una pantalla nueva, se agrega una entrada a PUSH_SCREENS
 * (y al `PushScreen` del contrato) con cómo convertir sus params.
 */
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { navigationRef } from "@/navigators/navigationUtilities"
import { PUSH_DATA_VERSION, type PushScreen } from "@/services/api/types"

export interface PushTarget {
  screen: PushScreen
  params?: AppStackParamList[PushScreen]
}

type RawParams = Record<string, string>

/**
 * Lista blanca. Cada pantalla sabe convertir los params del push (siempre
 * strings) a los params tipados de su ruta. Devuelve `null` si faltan datos
 * imprescindibles (p. ej. MatchDetail sin matchId) → no se navega.
 */
const PUSH_SCREENS: {
  [S in PushScreen]: (params: RawParams) => AppStackParamList[S] | null
} = {
  Feed: () => undefined,
  Friends: (p) => (p.initialTab === "requests" ? { initialTab: "requests" } : undefined),
  MatchDetail: (p) =>
    p.matchId ? { matchId: p.matchId, openApplicants: p.openApplicants === "1" } : null,
  NearbyGuestRequests: () => undefined,
  ReservationDetail: (p) => (p.reservationId ? { reservationId: p.reservationId } : null),
  GroupDetail: (p) => (p.groupId ? { groupId: p.groupId } : null),
}

export function isPushScreen(value: unknown): value is PushScreen {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PUSH_SCREENS, value)
}

/**
 * Payloads anteriores al contrato (backend previo a la Fase A): `type` suelto
 * + ids al nivel raíz, o solo `matchId` (recordatorio de 30 min). Se traduce
 * al contrato nuevo. Borrar cuando no queden backends viejos en producción.
 */
const LEGACY_PUSH_MAP: Record<string, (data: RawParams) => PushTarget | null> = {
  friendship_request: () => ({ screen: "Friends", params: { initialTab: "requests" } }),
  friendship_accepted: () => ({ screen: "Friends" }),
  match_guest_request: () => ({ screen: "NearbyGuestRequests" }),
  match_guest_application: (d) =>
    d.matchId
      ? { screen: "MatchDetail", params: { matchId: d.matchId, openApplicants: true } }
      : null,
  match_guest_accepted: (d) =>
    d.matchId ? { screen: "MatchDetail", params: { matchId: d.matchId } } : null,
  reservation_status: (d) =>
    d.reservationId
      ? { screen: "ReservationDetail", params: { reservationId: d.reservationId } }
      : null,
}

function stringEntries(value: unknown): RawParams {
  if (!value || typeof value !== "object") return {}
  const out: RawParams = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string") out[key] = raw
  }
  return out
}

/**
 * `data` de la notificación → destino validado, o `null` si no hay a dónde
 * ir (aviso informativo, versión desconocida, pantalla fuera de la lista
 * blanca o params insuficientes).
 */
export function resolvePushTarget(data: unknown): PushTarget | null {
  if (!data || typeof data !== "object") return null
  const record = data as Record<string, unknown>

  // Contrato nuevo.
  if (record.v !== undefined) {
    if (record.v !== PUSH_DATA_VERSION) return null
    if (!isPushScreen(record.screen)) return null
    const params = PUSH_SCREENS[record.screen](stringEntries(record.params))
    if (params === null) return null
    return { screen: record.screen, params }
  }

  // Payload viejo.
  const flat = stringEntries(record)
  const legacy = typeof flat.type === "string" ? LEGACY_PUSH_MAP[flat.type] : undefined
  if (legacy) return legacy(flat)
  if (!flat.type && flat.matchId) {
    return { screen: "MatchDetail", params: { matchId: flat.matchId } }
  }
  return null
}

let pendingTarget: PushTarget | null = null

/** true si el contenedor está listo y la ruta existe (la rama autenticada está montada). */
function canNavigateNow(screen: PushScreen): boolean {
  if (!navigationRef.isReady()) return false
  const routeNames = navigationRef.getRootState()?.routeNames as string[] | undefined
  return Array.isArray(routeNames) && routeNames.includes(screen)
}

function navigateTo(target: PushTarget) {
  // `screen` ya pasó por la lista blanca y `params` por su conversor tipado;
  // el genérico de navigationRef no puede expresar esa relación por pantalla.
  const navigate = navigationRef.navigate as unknown as (name: string, params?: unknown) => void
  navigate(target.screen, target.params)
}

/** Navega ahora o deja el destino en cola (contenedor no listo / sin sesión). */
export function dispatchPushNavigation(target: PushTarget): "navigated" | "queued" {
  if (canNavigateNow(target.screen)) {
    pendingTarget = null
    navigateTo(target)
    return "navigated"
  }
  pendingTarget = target
  console.info(`[push] destino en cola hasta que haya navegador y sesión: ${target.screen}`)
  return "queued"
}

/** Consume la cola si ya se puede navegar. Idempotente. */
export function flushPendingPushNavigation(): boolean {
  if (!pendingTarget) return false
  if (!canNavigateNow(pendingTarget.screen)) return false
  const target = pendingTarget
  pendingTarget = null
  navigateTo(target)
  return true
}

/** Sin sesión, la cola se descarta (logout explícito): no arrastrar destinos entre usuarios. */
export function clearPendingPushNavigation() {
  pendingTarget = null
}

export function getPendingPushTarget(): PushTarget | null {
  return pendingTarget
}

/**
 * Punto de entrada para el tap en una notificación (listener en foreground /
 * background, y la respuesta de arranque con la app cerrada).
 */
export function handlePushResponse(data: unknown): "navigated" | "queued" | "ignored" {
  const target = resolvePushTarget(data)
  if (!target) {
    const type =
      data && typeof data === "object" ? (data as Record<string, unknown>).type : undefined
    console.warn(`[push] tap sin destino navegable (type=${String(type ?? "?")})`)
    return "ignored"
  }
  return dispatchPushNavigation(target)
}
