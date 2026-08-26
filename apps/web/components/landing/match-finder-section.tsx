import Link from 'next/link'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Silueta simplificada de Colombia (viewBox 400x500), trazada a partir de
 * puntos geográficos reales (Guajira, frontera con Venezuela/Brasil, trapecio
 * amazónico, costa Pacífica, golfo de Urabá y costa Caribe).
 */
const COLOMBIA_PATH =
  'M228 4 L237 22 L210 42 L189 92 L177 132 L276 157 L297 182 L351 179 ' +
  'L357 224 L369 319 L282 305 L276 358 L279 470 L255 459 L171 392 ' +
  'L87 342 L9 314 L45 241 L54 179 L72 129 L54 109 L111 67 L132 45 ' +
  'L150 36 L186 31 Z'

/** Ciudades (coordenadas del viewBox 400x500 → % del contenedor del mapa). */
const CITY_PINS = [
  { name: 'Bogotá', left: '38.3%', top: '44.8%', main: true },
  { name: 'Medellín', left: '27%', top: '35.8%' },
  { name: 'Cali', left: '20.3%', top: '51.6%' },
  { name: 'Barranquilla', left: '33%', top: '9%' },
]

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
          {/* Mapa de Colombia con pines en ciudades reales. El contenedor
              conserva la proporción del viewBox para que los % de los pines
              coincidan con las coordenadas del path. */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="relative aspect-[4/5] max-h-full">
              <svg
                viewBox="0 0 400 500"
                className="h-full w-full"
                aria-label="Mapa de Colombia con partidos disponibles"
              >
                <path
                  d={COLOMBIA_PATH}
                  fill="color-mix(in srgb, var(--color-emerald) 8%, transparent)"
                  stroke="var(--color-emerald)"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d={COLOMBIA_PATH}
                  fill="none"
                  stroke="var(--color-orange)"
                  strokeOpacity="0.18"
                  strokeWidth="6"
                  strokeLinejoin="round"
                  style={{ filter: 'blur(4px)' }}
                />
              </svg>
              {CITY_PINS.map((pin) => (
                <div
                  key={pin.name}
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={{ top: pin.top, left: pin.left }}
                  title={pin.name}
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
          </div>
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
