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
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { AdminLogoutButton } from '@/components/admin/logout-button'
import type { AdminRole } from '@/lib/admin/roles'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  dataNav?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

function courtNavGroups(showCopaEliteForge: boolean): NavGroup[] {
  return [
    {
      label: 'Operación',
      items: [
        { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
        { href: '/admin/reservas', label: 'Reservas', icon: CalendarDays },
      ],
    },
    {
      label: 'Mi complejo',
      items: [{ href: '/admin/mi-cancha', label: 'Mi cancha', icon: Building2 }],
    },
    {
      label: 'Competencia',
      items: [
        { href: '/admin/torneos', label: 'Torneos', icon: Trophy },
        ...(showCopaEliteForge
          ? [
              {
                href: '/admin/copa-elite-forge',
                label: 'Copa Elite Forge',
                icon: Medal,
              },
            ]
          : []),
      ],
    },
    {
      label: 'Análisis',
      items: [
        {
          href: '/admin/analiticas',
          label: 'Analíticas',
          icon: ChartNoAxesCombined,
          dataNav: 'analiticas',
        },
      ],
    },
  ]
}

const adminNavGroups: NavGroup[] = [
  {
    label: 'General',
    items: [
      { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
      { href: '/admin/metricas', label: 'Métricas', icon: BarChart3 },
    ],
  },
  {
    label: 'Usuarios',
    items: [
      {
        href: '/admin/duenos-de-cancha',
        label: 'Dueños de cancha',
        icon: UsersRound,
      },
    ],
  },
  {
    label: 'Competencia',
    items: [
      {
        href: '/admin/campeonatos-elite-forge',
        label: 'Campeonatos Elite Forge',
        icon: Medal,
      },
    ],
  },
]

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
}

function linkClass(active: boolean, compact?: boolean) {
  const base = compact
    ? 'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
    : 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
  if (!active) {
    return `${base} text-muted-foreground hover:bg-secondary/60 hover:text-foreground`
  }
  // La barra izquierda de 3 px se dibuja con sombra interna para no mover el layout.
  return compact
    ? `${base} bg-primary/15 text-primary`
    : `${base} bg-primary/15 text-primary shadow-[inset_3px_0_0_0_var(--primary)]`
}

function NavLink({
  item,
  pathname,
  compact,
}: {
  item: NavItem
  pathname: string
  compact?: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={linkClass(isActive(pathname, item.href), compact)}
      data-nav={item.dataNav}
    >
      <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      {item.label}
    </Link>
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
  const groups = isAdmin ? adminNavGroups : courtNavGroups(showCopaEliteForge)
  const roleLabel = isAdmin ? 'Administrador' : 'Dueño de cancha'

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="inline-flex items-center">
            <Logo className="[&_img]:h-9" />
          </Link>
          <AdminLogoutButton />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {groups.flatMap((group) =>
            group.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} compact />
            )),
          )}
        </nav>
      </div>

      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-black/30 p-4 backdrop-blur-xl lg:flex">
        <div className="px-2 py-2">
          <Link href="/admin" className="inline-flex items-center">
            <Logo />
          </Link>
          <p className="mt-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
            {roleLabel}
          </p>
        </div>

        <nav className="mt-4 flex flex-1 flex-col overflow-y-auto">
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
