import { Apple, Play } from 'lucide-react'

export function DownloadSection() {
  return (
    <section id="descarga" className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div
        aria-hidden
        className="ef-glow-orange absolute -right-32 bottom-0 h-[24rem] w-[32rem]"
      />
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-[0_0_90px_-30px] shadow-orange/25 sm:p-12">
        <div
          aria-hidden
          className="ef-glow-orange absolute -right-24 -top-24 h-72 w-96"
        />
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-card-foreground text-balance sm:text-4xl">
              Lleva el juego en tu bolsillo
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
              Descarga la app de ELITE FORGE y obtén acceso total a tus
              estadísticas, partidos y comunidad en cualquier lugar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#"
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-5 py-3 transition-colors hover:border-primary/50"
              >
                <Apple className="h-7 w-7 text-foreground" />
                <span className="leading-tight">
                  <span className="block text-[10px] uppercase text-muted-foreground">
                    Descarga en
                  </span>
                  <span className="block font-heading font-semibold text-foreground">
                    App Store
                  </span>
                </span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-5 py-3 transition-colors hover:border-primary/50"
              >
                <Play className="h-7 w-7 text-foreground" />
                <span className="leading-tight">
                  <span className="block text-[10px] uppercase text-muted-foreground">
                    Disponible en
                  </span>
                  <span className="block font-heading font-semibold text-foreground">
                    Google Play
                  </span>
                </span>
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="rounded-2xl border border-border bg-secondary/40 p-6 text-center">
              <div
                className="mx-auto h-40 w-40 rounded-lg bg-foreground"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(var(--secondary) 0% 25%, var(--foreground) 0% 50%)',
                  backgroundSize: '16px 16px',
                }}
                aria-label="Código QR de descarga"
              />
              <p className="mt-3 font-heading text-xs font-semibold uppercase tracking-wide text-primary">
                Escanéame para bajar
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
