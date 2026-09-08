import { Check } from 'lucide-react'

/**
 * Posts de muestra escritos con lo que el feed real permite: texto, foto de
 * perfil, y lo que pasa en la app (grupos, VS, comodín, tests). Sin niveles,
 * distancias, ligas ni insignias — nada de eso existe.
 */
const posts = [
  {
    initials: 'CM',
    name: 'Carlos M.',
    handle: '@carlosm',
    text: 'Armamos el grupo Los Halcones y ya somos 9. ¿Quién se suma para el domingo?',
    tags: ['GRUPO'],
  },
  {
    initials: 'AS',
    name: 'Ana S.',
    handle: '@anasoto',
    text: 'VS confirmado contra Titanes para el sábado 18:00. Reserva hecha desde la app.',
    tags: ['PARTIDO VS', 'RESERVA'],
  },
  {
    initials: 'DF',
    name: 'Diego F.',
    handle: '@diegof',
    text: 'Nos faltaba un defensa, publicamos la vacante y en 20 minutos apareció un comodín de Cerca de mí.',
    tags: ['COMODÍN'],
  },
  {
    initials: 'LT',
    name: 'Luis T.',
    handle: '@luist',
    text: 'Hice el Beep test y el sprint de 30 m. Resistencia subió, velocidad todavía no. A seguir.',
    tags: ['TESTS'],
  },
]

/** Los 6 tests físicos reales (uno por estadística) + el de mentalidad. */
const tests = [
  { name: '10 tiros desde 16 m', stat: 'Ataque', done: true },
  { name: 'Defensa: control y recuperación', stat: 'Defensa', done: true },
  { name: 'Test de Beep (Yo-Yo / PACER)', stat: 'Resistencia', done: true },
  { name: 'Sprint 30 m', stat: 'Velocidad', done: true },
  { name: 'Pase Loughborough', stat: 'Pases', done: false },
  { name: 'Agilidad Illinois', stat: 'Regate', done: false },
  { name: 'Test de mentalidad y equipo', stat: 'Posición sugerida', done: true },
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
          Lo que publican tus amigos y los grupos donde juegas. Con foto real,
          comentarios y me gusta. Nada de ruido de desconocidos.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <div
            key={post.name}
            className="ef-card ef-card-hover rounded-2xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-heading font-bold text-primary ring-1 ring-primary/40">
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
                  className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/25"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tests + copy */}
      <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
        <div className="ef-card rounded-2xl p-6">
          <p className="mb-5 font-heading text-sm font-semibold uppercase tracking-wide text-card-foreground">
            Tu ficha de tests
          </p>
          <ul className="space-y-3">
            {tests.map((t) => (
              <li key={t.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${
                      t.done
                        ? 'bg-primary/15 text-primary ring-primary/40'
                        : 'text-muted-foreground/50 ring-white/15'
                    }`}
                  >
                    {t.done && <Check className="h-3 w-3" />}
                  </span>
                  <span className={t.done ? 'text-foreground' : 'text-muted-foreground'}>
                    {t.name}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-primary/80">
                  {t.stat}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-4xl">
            Estadísticas que se ganan
          </h3>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Cada test que completas actualiza su estadística en el radar. La
            app guarda tu último resultado por test, así que cuando vuelves a
            medirte ves si mejoraste. Con los tests y el de mentalidad, te
            sugiere en qué posición rindes mejor.
          </p>
        </div>
      </div>
    </section>
  )
}
