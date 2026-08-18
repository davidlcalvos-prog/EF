/**
 * These are configuration settings for the dev environment.
 *
 * Do not include API secrets in this file or anywhere in your JS.
 *
 * https://reactnative.dev/docs/security#storing-sensitive-info
 */
import { Platform } from "react-native"
import Constants from "expo-constants"

/**
 * LAN IP de tu PC en WiFi, usada solo cuando se corre en un dispositivo físico.
 * Configúrala en tu `.env.local` (no versionado, copia `.env.example`) como
 * EXPO_PUBLIC_DEV_LAN_HOST=192.168.x.x — cambia cada vez que te conectas desde
 * otra red. Ver docs/FRONTEND.md → "Desarrollo en dispositivo físico".
 */
const DEV_LAN_HOST = process.env.EXPO_PUBLIC_DEV_LAN_HOST ?? "192.168.1.132"

function getDevApiHost(): string {
  if (Platform.OS === "web") return "localhost"
  if (!Constants.isDevice) {
    return Platform.OS === "android" ? "10.0.2.2" : "localhost"
  }
  return DEV_LAN_HOST
}

export default {
  API_URL: `http://${getDevApiHost()}:3000/api/`,
  /** Portal web de registro (apps/web) — mismo host que la API para emulador/dispositivo */
  SIGN_UP_URL: `http://${getDevApiHost()}:5173/auth/sign-up`,
}
