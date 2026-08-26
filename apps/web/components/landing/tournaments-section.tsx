import { Users, Trophy, BarChart3 } from 'lucide-react'

const cards = [
  {
    icon: Users,
    title: 'Crea tu Equipo',
    desc: 'Invita a tus amigos, asigna posiciones y define tu táctica maestra.',
  },
  {
    icon: Trophy,
    title: 'Compite en Torneos',
    desc: 'Inscríbete en ligas locales, sube de división y gana recompensas exclusivas.',
  },
  {
    icon: BarChart3,
    title: 'Tablas de Clasificación',
    desc: 'Compara el rendimiento de tu equipo con otros en tu ciudad o país.',
  },
]

export function TournamentsSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div aria-hidden className="ef-glow-orange absolute -right-48 top-1/3 h-[26rem] w-[34rem]" />
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-4xl">
          Organización de torneos y equipos
        </h2>
        <p className="mt-3 text-muted-foreground">
          Crea tu escuadra, organiza grupos de juego y compite al más alto nivel.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={card.title}
            className={`ef-card ef-card-hover rounded-2xl p-6 ${i === 1 ? 'ef-card-orange' : ''}`}
          >
            <span className={`ef-chip h-12 w-12 ${i === 1 ? 'ef-chip-orange' : ''}`}>
              <card.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold uppercase tracking-wide text-card-foreground">
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
