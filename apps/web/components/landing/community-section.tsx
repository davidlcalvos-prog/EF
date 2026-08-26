import { Progress } from '@/components/ui/progress'

const posts = [
  {
    initials: 'CM',
    name: 'Carlos M.',
    handle: 'Nivel SEMI-PRO',
    text: '¡Acabo de hacer 3 goles y 1 asistencia en la liga nocturna. A por más!',
    tags: ['MVP', 'GOLEADOR'],
  },
  {
    initials: 'AS',
    name: 'Ana S.',
    handle: 'Nivel PRO',
    text: 'Nuevo récord personal: 79km recorridos en el medio juego.',
    tags: ['VELOCIDAD'],
  },
  {
    initials: 'DF',
    name: 'Diego F.',
    handle: 'Nivel AMATEUR',
    text: 'Buscando equipo para el torneo del domingo. ¡Interesados DM!',
    tags: ['EQUIPO'],
  },
  {
    initials: 'LT',
    name: 'Luis T.',
    handle: 'Nivel SEMI-PRO',
    text: 'Completando mi rutina de entrenamiento. ¡Mejorando la precisión!',
    tags: ['ENTRENO'],
  },
]

const progress = [
  { label: 'Prueba inicial (Mes 1)', level: 'Nivel Amateur', value: 35 },
  { label: 'Evaluación intermedia (Mes 3)', level: 'Nivel Semi-Pro', value: 65 },
  { label: 'Estado actual (Mes 6)', level: 'Nivel PRO', value: 92 },
]

export function CommunitySection() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div aria-hidden className="ef-glow-emerald absolute -left-48 bottom-0 h-[24rem] w-[32rem]" />
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-4xl">
          Feed social de la comunidad
        </h2>
        <p className="mt-3 text-muted-foreground">
          Muestra tus logros, inspírate y comparte las estadísticas de tus
          mejores partidos.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <div
            key={post.name}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-heading font-bold text-primary">
                {post.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {post.name}
                </p>
                <p className="text-xs text-muted-foreground">{post.handle}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {post.text}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress + copy */}
      <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-5 font-heading text-sm font-semibold uppercase tracking-wide text-card-foreground">
            Progresión histórica
          </p>
          <div className="space-y-5">
            {progress.map((p) => (
              <div key={p.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="font-semibold text-primary">{p.level}</span>
                </div>
                <Progress value={p.value} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-4xl">
            Estadísticas y avances
          </h3>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Monitorea tu evolución con nuestro panel detallado. Observa cómo
            mejoras desde tus pruebas iniciales hasta alcanzar el nivel
            profesional a través de gráficos dinámicos y reportes de progreso
            continuo.
          </p>
        </div>
      </div>
    </section>
  )
}
