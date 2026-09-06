import { LandingNav } from '@/components/landing/landing-nav'
import { LandingFooter } from '@/components/landing/final-cta'
import { LandingBackground } from '@/components/landing/landing-background'

/**
 * Página legal con contenido real (Privacidad). Mismo marco visual que
 * LegalPlaceholderPage (nav, fondo, footer, título, "Última actualización")
 * para que las páginas legales se vean consistentes entre sí; el cuerpo lo
 * aporta cada página como JSX (h2/p/listas — sin renderer de markdown, que
 * el proyecto no tiene y no vale la pena agregar solo para esto).
 */
export function LegalContentPage({
  title,
  updatedAt,
  children,
}: {
  title: string
  /** Fecha de publicación/actualización ya formateada ("día de mes de año"). */
  updatedAt: string
  children: React.ReactNode
}) {
  return (
    <main className="relative min-h-screen">
      <LandingBackground />
      <div className="relative z-10">
        <LandingNav />
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
          <h1 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Última actualización: {updatedAt}</p>
          <article className="mt-8 space-y-5 text-muted-foreground [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_hr]:border-white/10 [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_strong]:text-foreground [&_ul]:space-y-2">
            {children}
          </article>
        </div>
        <LandingFooter />
      </div>
    </main>
  )
}

/** Placeholder compartido de las páginas legales; el contenido real llega después. */
export function LegalPlaceholderPage({ title }: { title: string }) {
  const updatedAt = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="relative min-h-screen">
      <LandingBackground />
      <div className="relative z-10">
        <LandingNav />
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
          <h1 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-6 text-muted-foreground">Documento en preparación.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Última actualización: {updatedAt}
          </p>
        </div>
        <LandingFooter />
      </div>
    </main>
  )
}
