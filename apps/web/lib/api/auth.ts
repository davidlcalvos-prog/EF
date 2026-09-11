import { apiFetch } from "./client"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export function register(payload: {
  name: string
  email: string
  password: string
  /** Obligatorio y validado también en el backend (2026-09-11): sin `true` el registro es 400. */
  acceptTerms: true
  /** Versión aceptada = TERMS_VERSION de lib/legal/terms.ts; el backend la guarda en users.termsVersion. */
  termsVersion: string
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function login(payload: {
  email: string
  password: string
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// ── Recuperación y cambio de contraseña (2026-09-11) ──────────────────────

export interface PasswordActionResponse {
  ok: true
}

/**
 * Pedir enlace. El backend responde SIEMPRE 200 exista o no el correo
 * (anti-enumeración): la UI muestra el mismo mensaje en todos los casos.
 */
export function forgotPassword(payload: { email: string }): Promise<PasswordActionResponse> {
  return apiFetch<PasswordActionResponse>("auth/password/forgot", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/** Canjear el token del enlace. 400 = inválido, vencido o ya usado (sin distinguir). */
export function resetPassword(payload: {
  token: string
  password: string
}): Promise<PasswordActionResponse> {
  return apiFetch<PasswordActionResponse>("auth/password/reset", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
