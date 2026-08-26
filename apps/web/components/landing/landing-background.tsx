/**
 * Fondo futurista fijo de toda la landing: queda detrás del contenido y no
 * scrollea (efecto parallax). Las secciones le suman glows locales encima.
 */
export function LandingBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/* img en vez de background-image de CSS: mismo mecanismo que ya
          renderizaba bien cuando el SVG vivía dentro del hero. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing-bg.svg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Viñeta suave para que el contenido respire arriba y abajo. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/40" />
    </div>
  )
}
