import Link from 'next/link'
import { AdminLogoutButton } from '@/components/admin/logout-button'
import type { AdminRole } from '@/lib/admin/roles'

export function PortalHeader({
  role,
  userName,
  venueName,
}: {
  role: AdminRole
  userName: string
  /** null = Empresario sin cancha configurada; ignorado para Administrador. */
  venueName: string | null
}) {
  const isAdmin = role === 'Administrador'
  const roleLabel = isAdmin ? 'Administrador' : 'Dueño de cancha'

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 sm:px-8">
      <div className="min-w-0">
        {isAdmin ? (
          <p className="truncate font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
            Administración Elite Forge
          </p>
        ) : venueName ? (
          <p className="truncate font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
            {venueName}
          </p>
        ) : (
          <Link
            href="/admin/mi-cancha"
            className="truncate text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Sin cancha configurada — configúrala aquí
          </Link>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <p className="hidden text-right text-sm sm:block">
          <span className="text-foreground">{userName}</span>
          <span className="ml-2 text-xs text-muted-foreground">{roleLabel}</span>
        </p>
        <div className="hidden lg:block">
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  )
}
