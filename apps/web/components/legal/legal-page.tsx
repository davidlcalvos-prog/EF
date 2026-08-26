import { LandingNav } from '@/components/landing/landing-nav'
import { LandingFooter } from '@/components/landing/final-cta'

/** Placeholder compartido de las páginas legales; el contenido real llega después. */
export function LegalPlaceholderPage({ title }: { title: string }) {
  const updatedAt = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-background">
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
    </main>
  )
}
