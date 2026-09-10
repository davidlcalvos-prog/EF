import { AppState, Platform } from "react-native"
import Constants from "expo-constants"
import * as Notifications from "expo-notifications"

import { api } from "@/services/api"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const getProjectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId

const getExpoPushToken = async (): Promise<string | undefined> => {
  const projectId = getProjectId()
  if (!projectId) return undefined

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
  return data
}

/** Últimos 8 caracteres — suficiente para cruzar con `push_tokens` sin loguear el token entero. */
const tokenTail = (token: string) => `…${token.slice(-8)}`

/**
 * Cuándo se le puede mostrar al usuario el diálogo del sistema:
 * - "always": login explícito — es el momento natural para pedir permiso.
 * - "ifUndetermined": arranque con sesión guardada — solo si nunca se le
 *   preguntó. Si ya lo negó, no se lo vuelve a molestar en cada apertura
 *   (Android además deja de mostrar el diálogo tras dos negativas).
 * - "never": vuelta a primer plano — solo se aprovecha si el permiso ya está
 *   (p. ej. lo activó a mano en Ajustes del sistema).
 */
export type PushPromptPolicy = "always" | "ifUndetermined" | "never"

/** Token que ya se registró contra el backend en ESTA sesión de JS (se limpia en logout). */
let lastRegisteredToken: string | undefined
/** Registro en curso: las llamadas concurrentes (login + efecto de AuthContext) comparten la misma promesa. */
let inFlight: Promise<void> | undefined

/**
 * Pide permiso de notificaciones según `prompt` (no bloqueante — si el usuario
 * lo rechaza, no insiste ni bloquea el resto de la app) y registra el push
 * token contra el backend. Es idempotente dentro de la sesión de JS: si el
 * token ya se registró y no cambió, no vuelve a hacer el POST.
 *
 * Se llama desde el login (`prompt: "always"`), al arrancar con sesión
 * guardada y al recuperar el foco (ver `watchPushRegistration`). Antes solo
 * corría en el login: un usuario con sesión abierta nunca volvía a
 * registrarlo (ni tras reinstalar el build, ni si FCM rotaba el token).
 *
 * Deja rastro con `console.warn("[push] ...")` fuera de `__DEV__` en cada
 * salida temprana (QA 2026-09-07) y `console.info` al registrar, para que
 * `adb logcat | grep "\[push\]"` cuente la historia completa.
 */
export async function registerPushToken(options?: {
  prompt?: PushPromptPolicy
  /** Ignora el caché de `lastRegisteredToken` (rotación de token). */
  force?: boolean
}): Promise<void> {
  if (inFlight) return inFlight
  inFlight = doRegister(options?.prompt ?? "always", options?.force === true).finally(() => {
    inFlight = undefined
  })
  return inFlight
}

async function doRegister(prompt: PushPromptPolicy, force: boolean): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    const existing = await Notifications.getPermissionsAsync()
    let finalStatus = existing.status
    if (existing.status !== "granted") {
      const mayAsk =
        prompt === "always" || (prompt === "ifUndetermined" && existing.status === "undetermined")
      if (mayAsk && existing.canAskAgain) {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
    }
    if (finalStatus !== "granted") {
      console.warn(
        `[push] token no registrado: permiso de notificaciones "${finalStatus}" (canAskAgain=${existing.canAskAgain}, prompt=${prompt})`,
      )
      return
    }

    const token = await getExpoPushToken()
    if (!token) {
      console.warn("[push] token no registrado: Expo no devolvió token (¿falta projectId de EAS?)")
      return
    }

    if (!force && token === lastRegisteredToken) return

    const response = await api.registerPushToken(token, Platform.OS === "ios" ? "ios" : "android")
    if (response.kind !== "ok") {
      console.warn(`[push] el backend rechazó el token ${tokenTail(token)}: ${response.kind}`)
      return
    }
    lastRegisteredToken = token
    console.info(`[push] token registrado ${tokenTail(token)} (prompt=${prompt})`)
  } catch (error) {
    // Fuera de __DEV__ a propósito: sin rastro, "no me llegó la notificación"
    // era indistinguible de un bug del backend (QA 2026-09-07). En Android,
    // "Default FirebaseApp is not initialized" acá = falta google-services.json
    // en el build (ver FRONTEND.md → Notificaciones push en Android).
    console.warn("[push] registerPushToken lanzó excepción:", error)
  }
}

/**
 * Mantiene el registro vivo mientras hay sesión. Devuelve la función para
 * dejar de escuchar (cleanup del efecto en AuthContext).
 *
 * - App vuelve a primer plano → reintenta SIN pedir permiso. Cubre el caso
 *   "lo negué y después lo activé en Ajustes del sistema": antes quedaba
 *   muerto hasta el próximo login.
 * - FCM/APNs rota el token del dispositivo → se vuelve a pedir el Expo
 *   token y se registra el nuevo (el viejo lo limpia el backend cuando Expo
 *   responde DeviceNotRegistered).
 */
export function watchPushRegistration(): () => void {
  const appState = AppState.addEventListener("change", (state) => {
    if (state === "active") void registerPushToken({ prompt: "never" })
  })
  const tokenRotation = Notifications.addPushTokenListener(() => {
    void registerPushToken({ prompt: "never", force: true })
  })
  return () => {
    appState.remove()
    tokenRotation.remove()
  }
}

/**
 * Da de baja el push token de este dispositivo al hacer logout. Recibe el
 * bearer token explícitamente (en vez de depender del header compartido de
 * `api`) para no depender del orden en que `AuthContext` limpia la sesión.
 */
export async function unregisterPushToken(bearerToken: string): Promise<void> {
  lastRegisteredToken = undefined
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== "granted") return

    const token = await getExpoPushToken()
    if (!token) return

    await api.removePushToken(token, bearerToken)
  } catch (error) {
    if (__DEV__) console.log("unregisterPushToken failed", error)
  }
}

/**
 * Escucha el tap en una notificación push y navega al match correspondiente
 * (deep link para el aviso de 30 minutos, y para comodín: nuevo postulante o
 * aceptado — ambos ya viajan con matchId, ver match-guest-requests.service.ts).
 */
export function addNotificationTapListener(onMatchTap: (matchId: string) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const matchId = response.notification.request.content.data?.matchId
    if (typeof matchId === "string") onMatchTap(matchId)
  })
}

/**
 * Deep link para el aviso "se busca comodín cerca tuyo" (Fase 11) — el
 * candidato no es miembro del grupo, así que no puede abrir MatchDetailScreen;
 * lo manda a la lista "Cerca de mí" en su lugar.
 */
export function addGuestRequestNearbyTapListener(onTap: () => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const type = response.notification.request.content.data?.type
    if (type === "match_guest_request") onTap()
  })
}

/**
 * Deep link para "tu reserva fue confirmada/rechazada" (Fase W.1) — abre el
 * detalle de esa reserva puntual (venues.service.ts manda reservationId).
 */
export function addReservationStatusTapListener(onTap: (reservationId: string) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data
    if (data?.type !== "reservation_status") return
    const reservationId = data?.reservationId
    if (typeof reservationId === "string") onTap(reservationId)
  })
}
