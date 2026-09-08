import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroPlayer } from './hero-player'

/**
 * Imagen a sangre del hero. Todavía no existe en el repo (la ilustración se
 * encarga aparte): mientras falte, el hero deja ver el fondo fijo de la
 * landing (landing-bg.svg) sin pedir un archivo inexistente. Se resuelve en
 * el servidor (la página es estática, así que en build) buscando en
 * `public/` — en el standalone de producción `public/` se copia al lado del
 * server (scripts/copy-standalone-assets.js), así que la ruta es la misma.
 * Especificación de la imagen: FRONTEND-WEB.md → "Hero: imagen a sangre".
 */
const HERO_IMAGE_CANDIDATES = ['hero-player.webp', 'hero-player.png']

function resolveHeroImage(): string | null {
  for (const file of HERO_IMAGE_CANDIDATES) {
    if (fs.existsSync(path.join(process.cwd(), 'public', file))) return `/${file}`
  }
  return null
}

/**
 * Trazos direccionales del hero: líneas de velocidad y partículas en SVG
 * puro, animadas con CSS (ef-speed / ef-spark en globals.css). Puramente
 * decorativo; se apaga con prefers-reduced-motion.
 */
function SpeedLines() {
  const lines = [
    { y: 18, w: 34, delay: 0, o: 0.55 },
    { y: 26, w: 18, delay: 0.9, o: 0.35 },
    { y: 41, w: 28, delay: 0.4, o: 0.5 },
    { y: 57, w: 40, delay: 1.3, o: 0.6 },
    { y: 66, w: 16, delay: 0.2, o: 0.3 },
    { y: 79, w: 30, delay: 1.7, o: 0.45 },
    { y: 88, w: 22, delay: 0.7, o: 0.35 },
  ]
  const sparks = [
    { x: 58, y: 22, delay: 0.3 },
    { x: 71, y: 47, delay: 1.1 },
    { x: 64, y: 71, delay: 1.9 },
    { x: 83, y: 33, delay: 0.6 },
    { x: 77, y: 84, delay: 1.5 },
    { x: 90, y: 62, delay: 2.3 },
  ]
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {lines.map((l, i) => (
        <line
          key={i}
          className="ef-speed"
          x1={100}
          x2={100 + l.w}
          y1={l.y}
          y2={l.y}
          stroke="var(--color-emerald)"
          strokeOpacity={l.o}
          strokeWidth={i % 3 === 0 ? 0.5 : 0.28}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ animationDelay: `${l.delay}s` }}
        />
      ))}
      {sparks.map((s, i) => (
        <circle
          key={i}
          className="ef-spark"
          cx={s.x}
          cy={s.y}
          r={0.35}
          fill={i % 2 ? 'var(--color-orange)' : 'var(--color-emerald)'}
          style={{ animationDelay: `${s.delay}s` }}
        />
      ))}
    </svg>
  )
}

export function Hero() {
  const heroImage = resolveHeroImage()

  return (
    <section className="relative isolate overflow-hidden pt-16">
      {/* Capa 1: imagen a sangre (o nada → se ve landing-bg.svg, el fondo
          fijo de toda la landing). Capa 2: overlay oscuro de izquierda a
          derecha + fundido inferior para que el titular se lea siempre.
          Capa 3: trazos de velocidad. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {heroImage && (
          <div
            className="absolute inset-0 bg-cover bg-[position:70%_center] bg-no-repeat"
            style={{ backgroundImage: `url('${heroImage}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div className="ef-glow-orange absolute -bottom-40 left-1/4 h-96 w-[60rem] -translate-x-1/2" />
        <SpeedLines />
        {/* Capa 4: silueta animada (recibe → dribla → tira). En escritorio
            ocupa la mitad derecha, fuera del bloque de texto; en móvil se
            reduce, se corre a la derecha y baja de opacidad, y un degradado
            extra por encima garantiza el contraste del titular. */}
        <HeroPlayer className="absolute bottom-0 right-[-30%] h-[48%] opacity-60 sm:right-[-8%] sm:h-[62%] sm:opacity-85 md:right-[0%] md:h-[74%] md:opacity-100 lg:right-[1%] lg:h-[80%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/45 to-transparent md:hidden" />
      </div>

      <div className="relative mx-auto flex min-h-[82vh] max-w-7xl flex-col items-start justify-center px-4 py-20 text-left sm:px-6">
        <p className="ef-enter mb-4 font-heading text-xs font-semibold uppercase tracking-[0.35em] text-primary sm:text-sm">
          Elite Forge
        </p>
        {/* Saque inicial: cada línea entra desde abajo, escalonada (ef-enter
            en globals.css; se apaga con prefers-reduced-motion). Dos líneas,
            dos pesos: la primera en blanco, la segunda remata en el cian de
            marca. Compactas: line-height 0.9 y tracking cerrado. */}
        <h1 className="max-w-2xl font-heading text-4xl font-bold italic uppercase leading-[0.9] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">
          <span className="ef-enter block" style={{ animationDelay: '120ms' }}>
            El talento no nace.
          </span>
          <span className="ef-enter block text-primary" style={{ animationDelay: '300ms' }}>
            Se forja.
          </span>
        </h1>
        <p
          className="ef-enter mt-5 max-w-md font-heading text-sm font-medium uppercase tracking-wide text-muted-foreground sm:text-base"
          style={{ animationDelay: '520ms' }}
        >
          Tests que haces en la cancha. Un radar que te ganas.
        </p>

        <div className="ef-enter mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '660ms' }}>
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
