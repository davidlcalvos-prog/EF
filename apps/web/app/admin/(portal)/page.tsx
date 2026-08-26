import Link from 'next/link'
import { requireAdminSession } from '@/lib/admin/session'
import { AdminPageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { OwnerSummaryDashboard } from '@/components/admin/owner-summary'
import { listMyVenues } from '@/lib/dal/admin/venues'
import { listReservationsForVenueOwner } from '@/lib/dal/admin/reservations'

export default async function AdminHomePage() {
  const session = await requireAdminSession()
  const isPlatformAdmin = session.role === 'Administrador'

  if (isPlatformAdmin) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <AdminPageHeader
          title={`Hola, ${session.name.split(' ')[0]}`}
          subtitle="Panel de métricas y rendimiento de jugadores."
          breadcrumbs={[{ label: 'Resumen' }]}
        />
        <Button render={<Link href="/admin/metricas" />}>Ver métricas</Button>
      </div>
    )
  }

  const venues = await listMyVenues(session.user.id)
  let reservations: Awaited<
    ReturnType<typeof listReservationsForVenueOwner>
  > = []

  try {
    reservations = await listReservationsForVenueOwner(session.user.id)
  } catch {
    reservations = []
  }

  return (
    <OwnerSummaryDashboard
      firstName={session.name.split(' ')[0]}
      venues={venues}
      reservations={reservations}
    />
  )
}
