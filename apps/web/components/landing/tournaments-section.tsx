import { Trophy } from 'lucide-react'
import { BootsIcon, SoccerBallIcon } from '@/components/icons/football'

/**
 * Las tres funciones existen tal cual en la app (Grupos, Partidos internos /
 * VS, Campeonatos). Sin divisiones, recompensas ni tablas por ciudad: eso no
 * existe y no se promete.
 */
const cards = [
  {
    icon: BootsIcon,
    title: 'Arma tu grupo',
    desc: 'Crea el grupo, suma a tus amigos y define quién lidera. Cada uno con su posición favorita y su foto real.',
  },
  {
    icon: SoccerBallIcon,
    title: 'Partidos internos y VS',
    desc: 'Arma partidos entre los del grupo con equipos al azar, o desafía a otro grupo a un VS. Si falta uno, pides un comodín.',
  },
  {
    icon: Trophy,
    title: 'Campeonatos con rankings',
    desc: 'Inscribe a tu grupo en los campeonatos abiertos y sigue la tabla de goleadores y la mejor defensa de cada torneo.',
  },
]

export function TournamentsSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div aria-hidden className="ef-glow-orange absolute -right-48 top-1/3 h-[26rem] w-[34rem]" />
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-4xl">
          Grupos, partidos y campeonatos
        </h2>
        <p className="mt-3 text-muted-foreground">
          Del grupo de amigos al torneo: todo lo que pasa en la cancha, organizado en un solo lugar.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={card.title}
            className={`ef-card ef-card-hover ef-reveal rounded-2xl p-6 ${i === 1 ? 'ef-card-orange' : ''}`}
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
