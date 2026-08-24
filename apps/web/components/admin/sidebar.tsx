'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  BarChart3,
  Trophy,
  ChartNoAxesCombined,
  Medal,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { AdminLogoutButton } from '@/components/admin/logout-button'
import type { AdminRole } from '@/lib/admin/roles'

function linkClass(active: boolean, compact?: boolean) {
  const base = compact
    ? 'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
    : 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
  return active
    ? `${base} bg-primary/15 text-primary`
    : `${base} text-muted-foreground hover:bg-secondary/60 hover:text-foreground`
}

function CourtNav({
  pathname,
  compact,
  showCopaEliteForge,
}: {
  pathname: string
  compact?: boolean
  showCopaEliteForge: boolean
}) {
  const icon = compact ? 'h-4 w-4' : 'h-5 w-5'
  const is = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <>
      <Link href="/admin" className={linkClass(is('/admin'), compact)}>
        <LayoutDashboard className={icon} />
        Resumen
      </Link>
      <Link
        href="/admin/reservas"
        className={linkClass(is('/admin/reservas'), compact)}
      >
        <CalendarDays className={icon} />
        Reservas
      </Link>
      <Link
        href="/admin/mi-cancha"
        className={linkClass(is('/admin/mi-cancha'), compact)}
      >
        <Building2 className={icon} />
        Mi cancha
      </Link>
      <Link
        href="/admin/analiticas"
        className={linkClass(is('/admin/analiticas'), compact)}
        data-nav="analiticas"
      >
        <ChartNoAxesCombined className={icon} />
        Analíticas
      </Link>
      <Link
        href="/admin/torneos"
        className={linkClass(is('/admin/torneos'), compact)}
      >
        <Trophy className={icon} />
        Torneos
      </Link>
      {showCopaEliteForge && (
        <Link
          href="/admin/copa-elite-forge"
          className={linkClass(is('/admin/copa-elite-forge'), compact)}
        >
          <Medal className={icon} />
          Copa Elite Forge
        </Link>
      )}
    </>
  )
}

function AdminNav({ pathname, compact }: { pathname: string; compact?: boolean }) {
  const icon = compact ? 'h-4 w-4' : 'h-5 w-5'
  const is = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <>
      <Link href="/admin" className={linkClass(is('/admin'), compact)}>
        <LayoutDashboard className={icon} />
        Resumen
      </Link>
      <Link
        href="/admin/metricas"
        className={linkClass(is('/admin/metricas'), compact)}
      >
        <BarChart3 className={icon} />
        Métricas
      </Link>
      <Link
        href="/admin/campeonatos-elite-forge"
        className={linkClass(is('/admin/campeonatos-elite-forge'), compact)}
      >
        <Medal className={icon} />
        Campeonatos Elite Forge
      </Link>
    </>
  )
}

export function AdminSidebar({
  role,
  showCopaEliteForge = false,
}: {
  role: AdminRole
  /** Solo Empresario con surfaceType='synthetic_grass' ya configurado. */
  showCopaEliteForge?: boolean
}) {
  const pathname = usePathname()
  const isAdmin = role === 'Administrador'

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-border bg-sidebar lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="inline-flex items-center">
            <Logo className="[&_img]:h-9" />
          </Link>
          <AdminLogoutButton />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {isAdmin ? (
            <AdminNav pathname={pathname} compact />
          ) : (
            <CourtNav pathname={pathname} compact showCopaEliteForge={showCopaEliteForge} />
          )}
        </nav>
      </div>

      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar p-4 lg:flex">
        <div className="px-2 py-2">
          <Link href="/admin" className="inline-flex items-center">
            <Logo />
          </Link>
          <p className="mt-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
            Portal Admin
          </p>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
          {isAdmin ? (
            <AdminNav pathname={pathname} />
          ) : (
            <CourtNav pathname={pathname} showCopaEliteForge={showCopaEliteForge} />
          )}
        </nav>

        <div className="border-t border-border pt-2">
          <AdminLogoutButton />
        </div>
      </aside>
    </>
  )
}
