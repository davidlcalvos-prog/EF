import { Gauge, Map, Target } from 'lucide-react'
import { StatsRadar } from '@/components/stats-radar'

const features = [
  { icon: Gauge, label: 'Velocidad Máxima y Aceleración' },
  { icon: Map, label: 'Mapas de Calor Posicionales' },
  { icon: Target, label: 'Eficiencia de Pases y Tiros' },
]

const radarData = [
  { stat: 'Velocidad', value: 82 },
  { stat: 'Defensa', value: 68 },
  { stat: 'Pase', value: 90 },
  { stat: 'Tiro', value: 75 },
  { stat: 'Físico', value: 70 },
]

export function PerformanceSection() {
  return (
    <section id="rendimiento" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div
        aria-hidden
        className="ef-glow-emerald absolute -left-40 top-10 h-[28rem] w-[36rem]"
      />
      <div className="relative grid items-center gap-12 lg:grid-cols-2">
        {/* Stats card */}
        <div className="order-2 lg:order-1">
          <div className="ef-card rounded-2xl p-5 shadow-[0_20px_70px_-20px] shadow-emerald/20">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 font-heading font-bold text-primary ring-1 ring-primary/40">
                JP
              </div>
              <div>
                <p className="font-heading font-semibold text-card-foreground">
                  Juan Pérez
                </p>
                <p className="text-xs text-muted-foreground">
                  Mediocampista · Nivel PRO
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-black/25 p-4 ring-1 ring-white/5">
              <p className="mb-2 text-center font-heading text-sm font-semibold uppercase tracking-wide text-primary">
                Estadísticas
              </p>
              <StatsRadar data={radarData} />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-black/25 px-4 py-3 ring-1 ring-white/5">
              <div>
                <p className="text-xs text-muted-foreground">Posición Ranking</p>
                <p className="font-heading text-lg font-bold text-card-foreground">
                  #5
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Puntuación</p>
                <p className="font-heading text-lg font-bold text-primary">
                  79 / 100
                </p>
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
            Analiza cada sprint, cada pase y cada disparo con nuestra tecnología
            de rastreo técnico. Obtén métricas precisas sobre tu velocidad,
            distancia recorrida, mapas de calor y precisión en el campo.
          </p>

          <ul className="mt-6 space-y-3">
            {features.map((f, i) => (
              <li key={f.label} className="flex items-center gap-3">
                <span
                  className={`ef-chip h-9 w-9 ${i === 1 ? 'ef-chip-orange' : ''}`}
                >
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {f.label}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 font-heading text-2xl font-bold italic uppercase tracking-tight text-primary sm:text-3xl">
            Estadísticas en tiempo real
          </p>
        </div>
      </div>
    </section>
  )
}
