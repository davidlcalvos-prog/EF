import { AdminSidebar } from '@/components/admin/sidebar'
import { requireAdminSession } from '@/lib/admin/session'
import { getMyPrimaryVenue } from '@/lib/dal/admin/venues'

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdminSession()

  let showCopaEliteForge = false
  if (session.role === 'Empresario') {
    try {
      const venue = await getMyPrimaryVenue(session.user.id)
      showCopaEliteForge = venue?.surface_type === 'synthetic_grass'
    } catch {
      // Si el backend no responde, no rompemos el layout entero por un link de sidebar.
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar role={session.role} showCopaEliteForge={showCopaEliteForge} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
