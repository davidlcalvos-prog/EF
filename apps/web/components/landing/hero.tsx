import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SoccerBallIcon } from '@/components/icons/football'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16">
      {/* El fondo lo pone LandingBackground (fijo, a página completa);
          acá solo un degradado local para la legibilidad del titular. */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/20 to-transparent" />
        <div aria-hidden className="ef-glow-orange absolute -bottom-40 left-1/4 h-96 w-[60rem] -translate-x-1/2" />
      </div>

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6">
        <p className="ef-enter mb-3 font-heading text-sm font-medium uppercase tracking-[0.3em] text-primary">
          Elite Forge
        </p>
        {/* Saque inicial: cada línea entra desde abajo, escalonada, y el balón
            rueda desde la izquierda hasta su lugar (ver ef-* en globals.css;
            todo se apaga con prefers-reduced-motion). */}
        <h1 className="max-w-4xl font-heading text-5xl font-bold italic uppercase leading-[0.95] tracking-tight text-foreground text-balance sm:text-7xl lg:text-8xl">
          <span className="ef-enter block" style={{ animationDelay: '120ms' }}>
            El talento no nace.
          </span>
          <span className="ef-enter mt-2 flex items-center gap-4" style={{ animationDelay: '320ms' }}>
            <span className="text-primary">Se forja.</span>
            <SoccerBallIcon
              className="ef-ball-roll h-[0.8em] w-[0.8em] shrink-0 text-primary"
              style={{ animationDelay: '480ms' }}
            />
          </span>
        </h1>
        <p
          className="ef-enter mt-6 max-w-md font-heading text-base font-medium uppercase tracking-wide text-muted-foreground sm:text-lg"
          style={{ animationDelay: '560ms' }}
        >
          Tests que haces en la cancha. Un radar que te ganas.
        </p>

        <div className="ef-enter mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '700ms' }}>
          <Button
            render={<Link href="/auth/sign-up" />}
            size="lg"
            className="ef-cta h-12 px-8 font-heading text-base font-semibold uppercase tracking-wide"
          >
            Prueba inicial
            <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
          <Button
            render={<a href="#rendimiento" />}
            size="lg"
            variant="outline"
            className="h-12 px-8 font-heading text-base font-semibold uppercase tracking-wide"
          >
            Cómo funciona
          </Button>
        </div>
      </div>
    </section>
  )
}
