import Link from 'next/link'
import { LayoutDashboard, ArrowRight } from 'lucide-react'
import { PitchIcon } from '@/components/icons/football'
import { Button } from '@/components/ui/button'

/**
 * Reservas: nacen `pending` y las confirma o rechaza el dueño desde el
 * portal (no hay confirmación instantánea ni pagos). El portal de dueños
 * mide ocupación y horarios pico a partir de las reservas — no ingresos.
 */
export function CourtsSection() {
  return (
    <section id="canchas" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div aria-hidden className="ef-glow-orange absolute left-1/2 -top-20 h-[22rem] w-[40rem] -translate-x-1/2" />
      <h2 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-4xl">
        Gestión y reservas de canchas
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Los jugadores reservan desde la app. Los dueños administran todo desde el portal web.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="ef-card ef-card-hover ef-reveal rounded-2xl p-7">
          <span className="ef-chip h-12 w-12">
            <LayoutDashboard className="h-6 w-6" />
          </span>
          <h3 className="mt-5 font-heading text-xl font-semibold uppercase tracking-wide text-card-foreground">
            Portal para dueños de cancha
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Calendario de reservas por día, semana o mes. Inventario de canchas
            de fútbol 6, 8 y 11 con tarifas y servicios. Ocupación, horarios
            pico y clientes frecuentes a partir de tus reservas. Cada reserva
            que llega desde la app la confirmas o rechazas tú.
          </p>
          <Button
            render={<Link href="/admin/login" />}
            variant="outline"
            className="mt-5 font-heading font-medium uppercase tracking-wide"
          >
            Portal de dueños <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="ef-card ef-card-orange ef-card-hover ef-reveal rounded-2xl p-7">
          <span className="ef-chip ef-chip-orange h-12 w-12">
            <PitchIcon className="h-6 w-6" />
          </span>
          <h3 className="mt-5 font-heading text-xl font-semibold uppercase tracking-wide text-card-foreground">
            Reservas desde la app
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Eliges la sede, el tamaño de cancha y el horario; la app asigna
            una cancha libre y el dueño confirma. Te avisamos con una
            notificación cuando esté confirmada, y puedes vincular la reserva
            a un partido de tu grupo.
          </p>
          <Button
            render={<Link href="/auth/sign-up" />}
            className="ef-cta mt-5 font-heading font-semibold uppercase tracking-wide"
          >
            Crear cuenta para reservar <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
