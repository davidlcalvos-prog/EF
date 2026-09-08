import Link from 'next/link'
import { Apple, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Las tiendas todavía no tienen la app publicada al público. Los botones
 * quedan visibles pero deshabilitados ("Próximamente") — nunca `href="#"`,
 * que mandaba al usuario al tope de la página.
 */
const stores = [
  { icon: Apple, kicker: 'Próximamente en', name: 'App Store' },
  { icon: Play, kicker: 'Próximamente en', name: 'Google Play' },
]

export function DownloadSection() {
  return (
    <section id="descarga" className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div
        aria-hidden
        className="ef-glow-orange absolute -right-32 bottom-0 h-[24rem] w-[32rem]"
      />
      <div className="ef-card ef-card-orange ef-reveal relative overflow-hidden rounded-3xl p-8 shadow-[0_0_90px_-30px] shadow-orange/25 sm:p-12">
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
              La app de Elite Forge: tus tests, tu grupo, tus partidos, las
              reservas y los campeonatos, en el teléfono.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {stores.map((store) => (
                <div
                  key={store.name}
                  role="button"
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-5 py-3 opacity-60 select-none"
                >
                  <store.icon className="h-7 w-7 text-foreground" />
                  <span className="leading-tight">
                    <span className="block text-[10px] uppercase text-muted-foreground">
                      {store.kicker}
                    </span>
                    <span className="block font-heading font-semibold text-foreground">
                      {store.name}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="max-w-xs rounded-2xl border border-white/10 bg-black/25 p-6 text-center ring-1 ring-orange/20">
              <p className="font-heading text-sm font-semibold uppercase tracking-wide text-primary">
                Próximamente en las tiendas
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Mientras tanto, crea tu cuenta gratis: es la misma cuenta que
                usarás en la app el día que la descargues.
              </p>
              <Button
                render={<Link href="/auth/sign-up" />}
                variant="outline"
                className="mt-4 font-heading font-medium uppercase tracking-wide"
              >
                Crear cuenta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
