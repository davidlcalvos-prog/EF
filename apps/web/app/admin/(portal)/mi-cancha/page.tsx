import { requireAdminSession } from '@/lib/admin/session'
import { AdminPageHeader } from '@/components/admin/page-header'
import { getMyPrimaryVenue } from '@/lib/dal/admin/venues'
import { VenueSettingsForm } from '@/components/admin/venue-settings-form'
import { redirect } from 'next/navigation'

export default async function MiCanchaPage() {
  const session = await requireAdminSession()

  if (session.role === 'Administrador') {
    redirect('/admin/metricas')
  }

  let venue: Awaited<ReturnType<typeof getMyPrimaryVenue>> = null
  let loadError: string | null = null

  try {
    venue = await getMyPrimaryVenue(session.user.id)
  } catch {
    loadError =
      'No se pudo cargar la cancha. Verifica que el backend esté activo.'
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <AdminPageHeader
        title="Mi cancha"
        subtitle="Configura inventario por tamaño (6/8/11), tarifas y servicios del complejo."
      />

      {loadError && (
        <p className="mb-4 text-sm text-destructive">{loadError}</p>
      )}

      <VenueSettingsForm
        venue={
          venue
            ? {
                id: venue.id,
                name: venue.name,
                address: venue.address,
                price_per_hour_cents: venue.price_per_hour_cents,
                surface_type: venue.surface_type,
              }
            : null
        }
      />
    </div>
  )
}
