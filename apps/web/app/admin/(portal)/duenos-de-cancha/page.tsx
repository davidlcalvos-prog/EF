import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/admin/session'
import { listVenueOwners } from '@/lib/dal/admin/venue-owners'
import { VenueOwnersDashboard } from '@/components/admin/venue-owners-dashboard'

export default async function AdminDuenosDeCanchaPage() {
  const session = await requireAdminSession()

  // Exclusivo de Administrador — mismo mecanismo que Campeonatos Elite Forge.
  if (session.role !== 'Administrador') {
    redirect('/admin/reservas')
  }

  let owners: Awaited<ReturnType<typeof listVenueOwners>> = []
  let loadError: string | null = null

  try {
    owners = await listVenueOwners()
  } catch {
    loadError =
      'No se pudieron cargar los dueños de cancha. Verifica que el backend esté activo.'
  }

  return <VenueOwnersDashboard initialOwners={owners} loadError={loadError} />
}
