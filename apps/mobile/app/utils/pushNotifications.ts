import Constants from "expo-constants"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

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

/**
 * Pide permiso de notificaciones (no bloqueante — si el usuario lo rechaza,
 * no insiste ni bloquea el resto de la app) y registra el push token contra
 * el backend. Se llama una sola vez al hacer login, nunca en cada apertura.
 */
export async function registerPushToken(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== "granted") return

    const token = await getExpoPushToken()
    if (!token) return

    await api.registerPushToken(token, Platform.OS === "ios" ? "ios" : "android")
  } catch (error) {
    if (__DEV__) console.log("registerPushToken failed", error)
  }
}

/**
 * Da de baja el push token de este dispositivo al hacer logout. Recibe el
 * bearer token explícitamente (en vez de depender del header compartido de
 * `api`) para no depender del orden en que `AuthContext` limpia la sesión.
 */
export async function unregisterPushToken(bearerToken: string): Promise<void> {
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
 * (deep link para el aviso de 30 minutos, que reusa MatchDetailScreen).
 */
export function addNotificationTapListener(onMatchTap: (matchId: string) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const matchId = response.notification.request.content.data?.matchId
    if (typeof matchId === "string") onMatchTap(matchId)
  })
}
