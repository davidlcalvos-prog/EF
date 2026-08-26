'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'Rendimiento', href: '#rendimiento' },
  { label: 'Buscar Partido', href: '#buscador' },
  { label: 'Canchas', href: '#canchas' },
]

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="inline-flex items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-heading text-sm font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/admin/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Soy dueño de cancha
          </Link>
          <Button
            render={<Link href="/auth/sign-up" />}
            variant="ghost"
            className="text-foreground hover:text-primary"
          >
            Registro gratis
          </Button>
          <Button
            render={<a href="#descarga" />}
            className="font-heading font-semibold uppercase tracking-wide"
          >
            Descargar
          </Button>
        </div>

        <button
          className="text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-heading text-sm font-medium uppercase tracking-wide text-muted-foreground"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Soy dueño de cancha
            </Link>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                render={<Link href="/auth/sign-up" />}
                variant="outline"
              >
                Registro gratis
              </Button>
              <Button
                render={<a href="#descarga" />}
                onClick={() => setOpen(false)}
                className="font-heading font-semibold uppercase"
              >
                Descargar
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
