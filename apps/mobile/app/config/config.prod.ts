/**
 * These are configuration settings for the production environment.
 *
 * Do not include API secrets in this file or anywhere in your JS.
 *
 * https://reactnative.dev/docs/security#storing-sensitive-info
 */
export default {
  /**
   * La fuente es EXPO_PUBLIC_API_URL (inyectada por el perfil de eas.json en
   * build time); el fallback solo cubre builds hechos sin esa variable.
   */
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? "https://api.eliteforge.app/api/",
  /**
   * Registro en apps/web (NestJS + Prisma) — ya no usar el portal Hostinger antiguo (Supabase).
   * Cuando apps/web esté desplegado en producción, sustituye por la URL pública, p.ej.:
   * https://tu-dominio.com/auth/sign-up
   *
   * Mientras pruebas en local/dispositivo, usa la IP LAN de tu PC (apps/web en :5173).
   */
  SIGN_UP_URL: "http://192.168.1.132:5173/auth/sign-up",
}
