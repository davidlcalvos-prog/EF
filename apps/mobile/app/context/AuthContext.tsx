import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useMMKVString } from "react-native-mmkv"

import { api } from "@/services/api"
import {
  registerPushToken,
  unregisterPushToken,
  watchPushRegistration,
} from "@/utils/pushNotifications"

import { AUTH_TOKEN_STORAGE_KEY } from "./authTokenStorage"

export type AuthContextType = {
  isAuthenticated: boolean
  authToken?: string
  authEmail?: string
  authUserId?: string
  /** Foto de perfil real (Fase 12) — en memoria, no persistida; se repuebla al loguear. */
  authAvatarBase64: string | null
  setAuthToken: (token?: string) => void
  setAuthEmail: (email: string) => void
  setAuthUserId: (userId?: string) => void
  setAuthAvatarBase64: (avatarBase64: string | null) => void
  logout: () => void
  validationError: string
}

export const AuthContext = createContext<AuthContextType | null>(null)

export interface AuthProviderProps {}

export const AuthProvider: FC<PropsWithChildren<AuthProviderProps>> = ({ children }) => {
  // El header Authorization NO se sincroniza desde acá: el cliente API lee el
  // token directo de MMKV (misma clave) en cada request, vía request transform
  // — ver el constructor de `Api`. El useEffect que vivía acá corría después
  // de los efectos de las pantallas recién montadas y causaba el 401 del
  // primer fetch tras el login (Fase 8.1). El setter de useMMKVString escribe
  // en MMKV de forma síncrona, así que el transform ve el valor nuevo en el
  // mismo tick tanto en login como en logout.
  const [authToken, setAuthToken] = useMMKVString(AUTH_TOKEN_STORAGE_KEY)
  const [authEmail, setAuthEmail] = useMMKVString("AuthProvider.authEmail")
  const [authUserId, setAuthUserId] = useMMKVString("AuthProvider.authUserId")
  // En memoria a propósito (no MMKV): repoblar desde el backend al loguear
  // alcanza, y evita otra capa de caché desincronizada (mismo problema que
  // tuvimos con el token en la 8.1, ver el comentario de arriba).
  const [authAvatarBase64, setAuthAvatarBase64] = useState<string | null>(null)

  useEffect(() => {
    if (!authUserId || !authToken) {
      setAuthAvatarBase64(null)
      return
    }
    let cancelled = false
    api.getMyProfile(authUserId).then((result) => {
      if (cancelled) return
      if (result.kind === "ok") setAuthAvatarBase64(result.profile.avatarBase64)
    })
    return () => {
      cancelled = true
    }
  }, [authUserId, authToken])

  // Registro del push token mientras haya sesión. Cubre lo que el login solo
  // no cubría: arranque con sesión guardada (nunca se volvía a registrar —
  // ni tras reinstalar el build, ni si FCM rotaba el token), vuelta a primer
  // plano (permiso activado a mano en Ajustes) y rotación del token. En el
  // login, LoginScreen ya llamó registerPushToken({ prompt: "always" }) un
  // tick antes; esta llamada se suma a esa misma promesa en curso (dedupe en
  // pushNotifications.ts), así que no hay doble diálogo ni doble POST.
  useEffect(() => {
    if (!authToken) return
    void registerPushToken({ prompt: "ifUndetermined" })
    return watchPushRegistration()
  }, [authToken])

  const logout = useCallback(() => {
    if (authToken) void unregisterPushToken(authToken)
    setAuthToken(undefined)
    setAuthEmail("")
    setAuthUserId(undefined)
    setAuthAvatarBase64(null)
  }, [authToken, setAuthEmail, setAuthToken, setAuthUserId])

  // Sesión vencida (401 en un endpoint protegido con token guardado, ver el
  // monitor en services/api): mismo camino que el logout manual. Ref para que
  // el handler registrado una sola vez use siempre el `logout` vigente.
  const logoutRef = useRef(logout)
  logoutRef.current = logout
  useEffect(() => {
    api.setUnauthorizedHandler(() => logoutRef.current())
    return () => api.setUnauthorizedHandler(undefined)
  }, [])

  const validationError = useMemo(() => {
    if (!authEmail || authEmail.length === 0) return "can't be blank"
    if (authEmail.length < 6) return "must be at least 6 characters"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) return "must be a valid email address"
    return ""
  }, [authEmail])

  const value = {
    isAuthenticated: !!authToken,
    authToken,
    authEmail,
    authUserId,
    authAvatarBase64,
    setAuthToken,
    setAuthEmail,
    setAuthUserId,
    setAuthAvatarBase64,
    logout,
    validationError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
