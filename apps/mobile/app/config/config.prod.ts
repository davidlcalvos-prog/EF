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
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? "https://api.eliteforge.tech/api/",
  /**
   * La fuente es EXPO_PUBLIC_SIGN_UP_URL (inyectada por eas.json en build time);
   * el fallback apunta al registro de la web de producción.
   */
  SIGN_UP_URL: process.env.EXPO_PUBLIC_SIGN_UP_URL ?? "https://eliteforge.tech/auth/sign-up",
  /**
   * "¿Olvidaste tu contraseña?" (build 7): abre en el navegador la página de la
   * web que manda el enlace por correo. Fuente: EXPO_PUBLIC_FORGOT_PASSWORD_URL
   * (eas.json); el fallback apunta a producción.
   */
  FORGOT_PASSWORD_URL:
    process.env.EXPO_PUBLIC_FORGOT_PASSWORD_URL ?? "https://eliteforge.tech/auth/forgot-password",
}
