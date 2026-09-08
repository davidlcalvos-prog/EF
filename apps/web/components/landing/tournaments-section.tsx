'use client'

import { useState } from 'react'
import { ArrowUpRight, Trophy } from 'lucide-react'

import { BootsIcon, SoccerBallIcon } from '@/components/icons/football'
import { FeatureDialog, type LandingFeature } from './feature-dialog'

/**
 * Las tres funciones existen tal cual en la app (Grupos, Partidos internos /
 * VS, Campeonatos). Sin divisiones, recompensas ni tablas por ciudad: eso no
 * existe y no se promete. Cada card abre un modal que cuenta cómo funciona
 * en la app, con los términos que usa la app (es.ts).
 */
const cards: (LandingFeature & { desc: string })[] = [
  {
    icon: BootsIcon,
    title: 'Arma tu grupo',
    desc: 'Crea el grupo, suma a tus amigos y define quién lidera. Cada uno con su posición favorita y su foto real.',
    tagline:
      'El grupo es tu equipo de siempre: los que juegan contigo cada semana, con sus fotos, posiciones y estadísticas.',
    steps: [
      {
        title: 'Crea el grupo',
        text: 'Ponle nombre y foto. Quien lo crea es el creador; puede nombrar hasta 2 admins para que ayuden a organizar.',
      },
      {
        title: 'Suma miembros',
        text: 'Búscalos por alias o correo y agrégalos directo. Cada miembro aparece con su foto y su posición favorita.',
      },
      {
        title: 'Mira la ficha de cada jugador',
        text: 'Desde el grupo abres la ficha de cualquiera: su radar de tests y su posición sugerida.',
      },
      {
        title: 'Hazte amigo de otros grupos',
        text: 'Con "Grupos amigos" conectas tu grupo con otro. Es el paso previo para retarlos a un VS.',
      },
    ],
    note: 'Agregar a alguien lo suma al grupo en el momento; no hay invitación con aceptación todavía. El creador no se puede transferir.',
  },
  {
    icon: SoccerBallIcon,
    title: 'Partidos internos y VS',
    desc: 'Arma partidos entre los del grupo con equipos al azar, o desafía a otro grupo a un VS. Si falta uno, pides un comodín.',
    accent: 'orange',
    tagline:
      'Dos tipos de partido: interno (los del grupo, divididos en dos equipos) y VS (tu grupo contra un grupo amigo).',
    steps: [
      {
        title: 'Crea el partido',
        text: 'Elige fecha y hora, tamaño de cancha (de 5 vs 5 a 11 vs 11) y cuántos jugadores entran. Puedes vincularlo a una reserva de cancha.',
      },
      {
        title: 'Interno: sortea los equipos',
        text: 'Con "Sortear equipos" la app reparte a los anotados en dos. ¿No convence? "Volver a sortear".',
      },
      {
        title: 'VS: reta a un grupo amigo',
        text: 'El creador o un admin envía el reto; el partido queda "Esperando rival" hasta que el otro grupo acepta.',
      },
      {
        title: '¿Falta gente? Pide un comodín',
        text: 'Publica hasta 5 vacantes con posición. Jugadores de tu municipio se postulan y tú eliges quién entra.',
      },
      {
        title: 'Recordatorio y planilla',
        text: 'Aviso 30 minutos antes. El partido pasa de Borrador a Programado y a Jugado; la planilla queda en el grupo.',
      },
    ],
    note: 'Los partidos no registran goles ni resultados por jugador; las estadísticas del perfil salen solo de los tests.',
  },
  {
    icon: Trophy,
    title: 'Campeonatos con rankings',
    desc: 'Inscribe a tu grupo en los campeonatos abiertos y sigue la tabla de goleadores y la mejor defensa de cada torneo.',
    tagline:
      'Torneos organizados por Elite Forge junto a las canchas: inscribes a tu grupo como equipo y sigues el fixture desde la app.',
    steps: [
      {
        title: 'Inscripciones abiertas',
        text: 'Cada campeonato aparece con su formato (por ejemplo "Grupos de 4"). Inscribes a tu grupo mientras el cupo esté abierto.',
      },
      {
        title: 'En juego',
        text: 'Cuando se genera el fixture, ves las fechas y los cruces de tu equipo. Los resultados los carga la organización.',
      },
      {
        title: 'Rankings del torneo',
        text: 'Goleadores, valla menos vencida, mejor defensa y mejor distribuidor. Solo del torneo, no hay tabla global.',
      },
      {
        title: 'Conecta con rivales',
        text: 'Desde un ranking abres la ficha de un jugador y le envías solicitud de amistad.',
      },
    ],
    note: 'No hay ligas por división, ascensos ni premios dentro de la app. Cada campeonato es un torneo con su propia tabla.',
  },
]

export function TournamentsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
          <button
            key={card.title}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-haspopup="dialog"
            className={`ef-card ef-card-hover ef-reveal cursor-pointer rounded-2xl p-6 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
              i === 1 ? 'ef-card-orange' : ''
            }`}
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
            <span className="mt-4 inline-flex items-center gap-1 font-heading text-xs font-semibold uppercase tracking-wide text-primary">
              Cómo funciona <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>

      <FeatureDialog
        feature={openIndex === null ? null : cards[openIndex]}
        open={openIndex !== null}
        onOpenChange={(open) => {
          if (!open) setOpenIndex(null)
        }}
      />
    </section>
  )
}
