/**
 * Fondo futurista fijo de toda la landing: queda detrás del contenido y no
 * scrollea (efecto parallax). Las secciones le suman glows locales encima.
 */
export function LandingBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/landing-bg.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Viñeta suave para que el contenido respire arriba y abajo. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-transparent to-background/45" />
    </div>
  )
}
