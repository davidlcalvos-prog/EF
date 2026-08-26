import Link from 'next/link'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MatchFinderSection() {
  return (
    <section id="buscador" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Map visual */}
        <div className="ef-card relative aspect-[4/3] overflow-hidden rounded-2xl">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at center, color-mix(in srgb, var(--primary) 12%, transparent), transparent 60%)',
            }}
          />
          {/* Pins */}
          {[
            { top: '30%', left: '35%' },
            { top: '55%', left: '60%' },
            { top: '45%', left: '48%', main: true },
            { top: '68%', left: '28%' },
          ].map((pin, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: pin.top, left: pin.left }}
            >
              <span className="relative flex h-8 w-8 items-center justify-center">
                {pin.main && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                )}
                <MapPin
                  className={
                    pin.main
                      ? 'relative h-8 w-8 fill-primary/30 text-primary'
                      : 'relative h-6 w-6 text-primary/70'
                  }
                />
              </span>
            </div>
          ))}
        </div>

        {/* Copy */}
        <div>
          <h2 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-4xl">
            Buscador de partidos
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Encuentra partidos locales que se adaptan a tu nivel y horario.
            Utiliza nuestra vista de mapa interactivo o la lista de eventos para
            unirte a la acción en segundos.
          </p>
          <Button
            render={<Link href="/auth/sign-up" />}
            size="lg"
            className="ef-cta mt-6 h-12 px-6 font-heading font-semibold uppercase tracking-wide"
          >
            <Search className="mr-1 h-5 w-5" />
            Explorar Mapa
          </Button>
        </div>
      </div>
    </section>
  )
}
