import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { useMMKVString } from "react-native-mmkv"

import { unregisterPushToken } from "@/utils/pushNotifications"

import { AUTH_TOKEN_STORAGE_KEY } from "./authTokenStorage"

export type AuthContextType = {
  isAuthenticated: boolean
  authToken?: string
  authEmail?: string
  authUserId?: string
  setAuthToken: (token?: string) => void
  setAuthEmail: (email: string) => void
  setAuthUserId: (userId?: string) => void
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

  const logout = useCallback(() => {
    if (authToken) void unregisterPushToken(authToken)
    setAuthToken(undefined)
    setAuthEmail("")
    setAuthUserId(undefined)
  }, [authToken, setAuthEmail, setAuthToken, setAuthUserId])

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
    setAuthToken,
    setAuthEmail,
    setAuthUserId,
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
