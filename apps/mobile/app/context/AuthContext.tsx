import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import { useMMKVString } from "react-native-mmkv"

import { api } from "@/services/api"

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
  const [authToken, setAuthToken] = useMMKVString("AuthProvider.authToken")
  const [authEmail, setAuthEmail] = useMMKVString("AuthProvider.authEmail")
  const [authUserId, setAuthUserId] = useMMKVString("AuthProvider.authUserId")

  // Mantiene el header Authorization del cliente API en sync con el token
  // (login, logout, e hidratación inicial desde MMKV al abrir la app).
  useEffect(() => {
    api.setAuthToken(authToken)
  }, [authToken])

  const logout = useCallback(() => {
    setAuthToken(undefined)
    setAuthEmail("")
    setAuthUserId(undefined)
  }, [setAuthEmail, setAuthToken, setAuthUserId])

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
