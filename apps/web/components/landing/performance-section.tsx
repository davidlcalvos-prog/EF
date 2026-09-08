import { Brain, ClipboardCheck, Timer } from 'lucide-react'
import { StatsRadar } from '@/components/stats-radar'

/**
 * Todo lo que dice esta sección existe en la app: 6 tests físicos que el
 * jugador carga a mano (uno por stat, ver STAT_TO_TEST en mobile) y un test
 * de mentalidad. No hay GPS, wearables ni "tiempo real" — no prometerlos.
 */
const features = [
  {
    icon: ClipboardCheck,
    label: '6 tests físicos con protocolo',
    detail:
      'Tiros desde 16 m, control defensivo, Beep test, Sprint 30 m, pase Loughborough y agilidad Illinois.',
  },
  {
    icon: Timer,
    label: 'Tú mides, tú cargas el resultado',
    detail:
      'Un cronómetro, un balón y una cancha. Cada resultado actualiza una de las 6 estadísticas.',
  },
  {
    icon: Brain,
    label: 'Test de mentalidad y equipo',
    detail:
      'Cómo juegas bajo presión y cómo te llevas con el grupo. Con eso la app te sugiere una posición.',
  },
]

/** Mismo orden y mismas etiquetas que STAT_ORDER / es.ts en la app. */
const radarData = [
  { stat: 'Ataque', value: 72 },
  { stat: 'Defensa', value: 64 },
  { stat: 'Resistencia', value: 81 },
  { stat: 'Velocidad', value: 77 },
  { stat: 'Pases', value: 69 },
  { stat: 'Regate', value: 58 },
]

export function PerformanceSection() {
  return (
    <section id="rendimiento" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div
        aria-hidden
        className="ef-glow-emerald absolute -left-40 top-10 h-[28rem] w-[36rem]"
      />
      <div className="relative grid items-center gap-12 lg:grid-cols-2">
        {/* Stats card — perfil de ejemplo con los 6 stats reales */}
        <div className="order-2 lg:order-1">
          <div className="ef-card rounded-2xl p-5 shadow-[0_20px_70px_-20px] shadow-emerald/20">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading font-bold text-primary ring-1 ring-primary/40">
                JP
              </div>
              <div className="min-w-0">
                <p className="font-heading font-semibold text-card-foreground">
                  Juan Pérez
                </p>
                <p className="text-xs text-muted-foreground">
                  @juanp · Mediocampista (posición favorita)
                </p>
              </div>
              <span className="ml-auto shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-white/10">
                Ejemplo
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-black/25 p-4 ring-1 ring-white/5">
              <p className="mb-2 text-center font-heading text-sm font-semibold uppercase tracking-wide text-primary">
                Estadísticas
              </p>
              <StatsRadar data={radarData} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-black/25 px-4 py-3 ring-1 ring-white/5">
                <p className="text-xs text-muted-foreground">Tests físicos</p>
                <p className="font-heading text-lg font-bold text-card-foreground">
                  6{' '}
                  <span className="text-sm font-medium text-muted-foreground">
                    / 6 completados
                  </span>
                </p>
              </div>
              <div className="rounded-xl bg-black/25 px-4 py-3 ring-1 ring-white/5">
                <p className="text-xs text-muted-foreground">Test de mentalidad</p>
                <p className="font-heading text-lg font-bold text-primary">Completado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <h2 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-4xl">
            Medición de rendimiento
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Sin sensores ni promesas mágicas: seis tests físicos con protocolo
            que haces en la cancha y cargas en la app, más un test de
            mentalidad. Con eso se arma tu radar de seis estadísticas: Ataque,
            Defensa, Resistencia, Velocidad, Pases y Regate. Y se actualiza
            cada vez que vuelves a medirte.
          </p>

          <ul className="mt-6 space-y-4">
            {features.map((f, i) => (
              <li key={f.label} className="flex items-start gap-3">
                <span
                  className={`ef-chip h-9 w-9 shrink-0 ${i === 1 ? 'ef-chip-orange' : ''}`}
                >
                  <f.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {f.label}
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {f.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 font-heading text-2xl font-bold italic uppercase tracking-tight text-primary sm:text-3xl">
            Medirse es el primer paso
          </p>
        </div>
      </div>
    </section>
  )
}
