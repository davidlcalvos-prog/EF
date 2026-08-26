import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16">
      <div className="absolute inset-0">
        <Image
          src="/hero-player.svg"
          alt="Jugador de fútbol ejecutando una chilena en un estadio nocturno"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/25 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        <div aria-hidden className="ef-glow-orange absolute -bottom-40 left-1/4 h-96 w-[60rem] -translate-x-1/2" />
      </div>

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6">
        <p className="mb-3 font-heading text-sm font-medium uppercase tracking-[0.3em] text-primary">
          Elite Forge
        </p>
        <h1 className="max-w-3xl font-heading text-5xl font-bold italic uppercase leading-[0.95] tracking-tight text-foreground text-balance sm:text-7xl lg:text-8xl">
          Del amateur <br />
          al <span className="text-primary">pro</span>
        </h1>
        <p className="mt-6 max-w-md font-heading text-base font-medium uppercase tracking-wide text-muted-foreground sm:text-lg">
          Mide tus estadísticas y eleva tu juego
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            render={<Link href="/auth/sign-up" />}
            size="lg"
            className="h-12 px-8 font-heading text-base font-semibold uppercase tracking-wide"
          >
            Prueba inicial
            <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
