import { AdminSidebar } from '@/components/admin/sidebar'
import { PortalHeader } from '@/components/admin/portal-header'
import { LandingBackground } from '@/components/landing/landing-background'
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
    <div className="relative min-h-screen">
      <LandingBackground />
      {/* Velo que atenúa el fondo para mantener el portal legible y sobrio. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-background/55" />
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
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
    </div>
  )
}
