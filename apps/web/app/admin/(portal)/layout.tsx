import { AdminSidebar } from '@/components/admin/sidebar'
import { PortalHeader } from '@/components/admin/portal-header'
import { requireAdminSession } from '@/lib/admin/session'
import { getMyPrimaryVenue } from '@/lib/dal/admin/venues'

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdminSession()

  let venue: Awaited<ReturnType<typeof getMyPrimaryVenue>> = null
  if (session.role === 'Empresario') {
    try {
      venue = await getMyPrimaryVenue(session.user.id)
    } catch {
      // Si el backend no responde, no rompemos el layout entero por el header/sidebar.
    }
  }
  const showCopaEliteForge = venue?.surface_type === 'synthetic_grass'

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar role={session.role} showCopaEliteForge={showCopaEliteForge} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalHeader
          role={session.role}
          userName={session.name}
          venueName={venue?.name ?? null}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
