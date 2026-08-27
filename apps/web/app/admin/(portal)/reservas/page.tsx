import { requireAdminSession } from '@/lib/admin/session'
import { AdminPageHeader } from '@/components/admin/page-header'
import { listReservationsForVenueOwner } from '@/lib/dal/admin/reservations'
import { listMyVenues } from '@/lib/dal/admin/venues'
import { ReservationsCalendar } from '@/components/admin/reservations-calendar'
import { redirect } from 'next/navigation'

export default async function AdminReservasPage() {
  const session = await requireAdminSession()

  if (session.role === 'Administrador') {
    redirect('/admin/metricas')
  }

  let reservations: Awaited<ReturnType<typeof listReservationsForVenueOwner>> =
    []
  let loadError: string | null = null

  const venues = await listMyVenues(session.user.id)
  const venue = venues[0] ?? null

  try {
    reservations = await listReservationsForVenueOwner(session.user.id)
  } catch {
    loadError =
      'No se pudieron cargar las reservas. Verifica que el backend esté activo.'
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <AdminPageHeader
        title="Reservas"
        subtitle="Calendario 8 AM–10 PM · por cancha · día, semana y mes."
        breadcrumbs={[
          { label: 'Resumen', href: '/admin' },
          { label: 'Reservas' },
        ]}
      />

      {loadError && (
        <p className="mb-4 text-sm text-destructive">{loadError}</p>
      )}

      <ReservationsCalendar
        reservations={reservations}
        venueId={venue?.id ?? null}
        courts={venue?.courts ?? []}
      />
    </div>
  )
}
