import Link from 'next/link'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Silueta de Colombia (viewBox 360x500), proyección equirectangular
 * x=(lon+79.5)·28, y=(12.8−lat)·28, trazada con puntos de frontera reales:
 * Guajira (Punta Gallinas/Espada), serranía de Perijá, Catatumbo, Arauca,
 * Puerto Carreño y el Orinoco, Piedra del Cocuy, frontera con Brasil,
 * trapecio amazónico (Leticia), Putumayo, frontera con Ecuador, costa
 * Pacífica, Darién/Cabo Tiburón, golfo de Urabá y costa Caribe.
 */
const COLOMBIA_PATH =
  'M219 10 L236 20 L229 28 L206 48 L195 70 L185 94 L199 113 L197 133 ' +
  'L209 153 L244 160 L281 186 L336 185 L326 217 L340 251 L330 279 ' +
  'L347 301 L353 323 L325 332 L288 342 L270 342 L267 372 L277 398 ' +
  'L267 477 L251 466 L213 426 L165 395 L132 364 L87 347 L56 336 ' +
  'L18 318 L21 302 L45 274 L60 251 L59 210 L54 204 L60 168 L45 160 ' +
  'L64 134 L60 116 L73 133 L77 118 L87 111 L112 67 L130 49 L148 43 ' +
  'L185 35 Z'

/**
 * Ciudades con su lon/lat proyectada al viewBox 360x500 (→ % del contenedor).
 * labelSide evita que las etiquetas cercanas se pisen entre sí.
 */
const CITY_PINS: {
  name: string
  left: string
  top: string
  main?: boolean
  labelSide: 'left' | 'right'
}[] = [
  { name: 'Bogotá', left: '42.2%', top: '45.9%', main: true, labelSide: 'right' },
  { name: 'Medellín', left: '30.6%', top: '36.7%', labelSide: 'left' },
  { name: 'Cali', left: '23.1%', top: '52.4%', labelSide: 'left' },
  { name: 'Barranquilla', left: '36.5%', top: '10.1%', labelSide: 'right' },
  { name: 'Cartagena', left: '31.1%', top: '13.5%', labelSide: 'left' },
  { name: 'Bucaramanga', left: '49.6%', top: '31.7%', labelSide: 'right' },
  { name: 'Pereira', left: '29.6%', top: '44.7%', labelSide: 'left' },
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
            <div className="relative aspect-[360/500] max-h-full">
              <svg
                viewBox="0 0 360 500"
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
                >
                  <span
                    className={`relative flex items-center justify-center ${
                      pin.main ? 'h-8 w-8' : 'h-5 w-5'
                    }`}
                  >
                    {pin.main && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                    )}
                    <MapPin
                      className={
                        pin.main
                          ? 'relative h-8 w-8 fill-primary/30 text-primary'
                          : 'relative h-5 w-5 text-primary/70'
                      }
                    />
                    <span
                      className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-heading text-[10px] font-semibold uppercase tracking-wide ${
                        pin.main ? 'text-foreground' : 'text-foreground/75'
                      } ${
                        pin.labelSide === 'right'
                          ? 'left-full ml-1.5'
                          : 'right-full mr-1.5'
                      }`}
                      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                    >
                      {pin.name}
                    </span>
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
