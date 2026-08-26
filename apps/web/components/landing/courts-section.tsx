import Link from 'next/link'
import { LayoutDashboard, CalendarCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CourtsSection() {
  return (
    <section id="canchas" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div aria-hidden className="ef-glow-orange absolute left-1/2 -top-20 h-[22rem] w-[40rem] -translate-x-1/2" />
      <h2 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-4xl">
        Gestión y reservas de canchas
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Administra y reserva los mejores campos de juego al instante.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="ef-card ef-card-hover rounded-2xl p-7">
          <span className="ef-chip h-12 w-12">
            <LayoutDashboard className="h-6 w-6" />
          </span>
          <h3 className="mt-5 font-heading text-xl font-semibold uppercase tracking-wide text-card-foreground">
            Gestión de Canchas para Dueños
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Panel integral para propietarios de canchas sintéticas. Monitorea el
            uso, mantenimiento y flujo de ingresos en tiempo real.
          </p>
          <Button
            render={<Link href="/admin/login" />}
            variant="outline"
            className="mt-5 font-heading font-medium uppercase tracking-wide"
          >
            Licencia Manager <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="ef-card ef-card-orange ef-card-hover rounded-2xl p-7">
          <span className="ef-chip ef-chip-orange h-12 w-12">
            <CalendarCheck className="h-6 w-6" />
          </span>
          <h3 className="mt-5 font-heading text-xl font-semibold uppercase tracking-wide text-card-foreground">
            Reservas Online para Jugadores
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sistema de reservas en tiempo real. Asegura el tiempo de
            entrenamiento de tu equipo con confirmación instantánea y división de
            pagos.
          </p>
          <Button
            render={<Link href="/auth/sign-up" />}
            className="ef-cta mt-5 font-heading font-semibold uppercase tracking-wide"
          >
            Reservar Ahora <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
