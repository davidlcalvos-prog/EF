import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-secondary/20">
      <div
        aria-hidden
        className="ef-glow-orange absolute left-1/2 top-1/2 h-[30rem] w-[60rem] -translate-x-1/2 -translate-y-1/2"
      />
      <div
        aria-hidden
        className="ef-glow-emerald absolute -left-40 -top-24 h-72 w-[28rem]"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground text-balance sm:text-5xl">
          ¿Listo para forjar tu legado?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Únete a miles de jugadores que ya están transformando su nivel amateur
          en rendimiento profesional.
        </p>
        <Button
          render={<Link href="/auth/sign-up" />}
          size="lg"
          className="ef-cta mt-8 h-13 px-10 font-heading text-base font-semibold uppercase tracking-wide"
        >
          Crea tu cuenta gratis
        </Button>
      </div>
    </section>
  )
}

const footerColumns = [
  {
    title: 'Jugadores',
    links: [
      { label: 'Descargar', href: '#descarga' },
      { label: 'Prueba inicial', href: '/auth/sign-up' },
    ],
  },
  {
    title: 'Canchas',
    links: [{ label: 'Portal de dueños', href: '/admin/login' }],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos de uso', href: '/legal/terminos' },
      { label: 'Privacidad', href: '/legal/privacidad' },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Logo />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Del amateur al pro: rendimiento, torneos y canchas en un solo
              lugar.
            </p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="font-heading text-xs font-semibold uppercase tracking-widest text-foreground">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Elite Forge. Todos los derechos
          reservados.
          {process.env.NEXT_PUBLIC_BUILD_ID && (
            <span className="ml-2 opacity-50">
              build {process.env.NEXT_PUBLIC_BUILD_ID.slice(0, 10)}
            </span>
          )}
        </p>
      </div>
    </footer>
  )
}
