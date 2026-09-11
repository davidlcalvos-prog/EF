/**
 * ÚNICA fuente de la versión de los Términos y Condiciones (2026-09-11).
 *
 * La versión ES la fecha de publicación del documento (YYYY-MM-DD). De acá
 * salen: la etiqueta "Última actualización" de /legal/terminos (derivada, no
 * duplicada) y el `termsVersion` que el registro manda al backend, que lo
 * guarda en users.termsVersion junto con users.termsAcceptedAt. Así, dentro de
 * seis meses se puede saber qué texto aceptó cada cuenta: la versión apunta al
 * commit de docs/terminos-y-condiciones-elite-forge.md vigente ese día.
 *
 * Al publicar un cambio de los términos: actualizar ESTA constante (y el
 * documento fuente). Nada más.
 */
export const TERMS_VERSION = '2026-09-11'

/** "11 de septiembre de 2026" — derivada de TERMS_VERSION, en la zona de Colombia. */
export const TERMS_UPDATED_AT_LABEL = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(`${TERMS_VERSION}T12:00:00-05:00`))
