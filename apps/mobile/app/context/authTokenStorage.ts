/**
 * Clave MMKV del token de sesión — módulo propio (sin imports) porque la leen
 * dos lados que no pueden importarse entre sí sin crear un ciclo:
 * `AuthContext.tsx` (la escribe vía useMMKVString) y `services/api/index.ts`
 * (la lee en el request transform que adjunta el header Authorization).
 * `useMMKVString` sin instancia explícita y `utils/storage` (`new MMKV()`)
 * comparten la misma instancia por defecto ("mmkv.default"), así que ambos
 * ven exactamente el mismo valor.
 */
export const AUTH_TOKEN_STORAGE_KEY = "AuthProvider.authToken"
