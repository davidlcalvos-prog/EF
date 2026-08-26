import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/admin/session'
import { AdminPageHeader } from '@/components/admin/page-header'
import { listAssignedMatchesForVenueOwner } from '@/lib/dal/admin/tournaments-api'
import { CopaEliteForgeList } from '@/components/admin/copa-elite-forge-list'

export default async function AdminCopaEliteForgePage() {
  const session = await requireAdminSession()

  if (session.role === 'Administrador') {
    redirect('/admin/metricas')
  }

  let matches: Awaited<ReturnType<typeof listAssignedMatchesForVenueOwner>> = []
  let loadError: string | null = null

  try {
    matches = await listAssignedMatchesForVenueOwner()
  } catch {
    loadError =
      'No se pudieron cargar los partidos. Verifica que el backend esté activo.'
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <AdminPageHeader
        title="Copa Elite Forge"
        subtitle="Partidos oficiales de Elite Forge que le tocaron a tu cancha, sorteados entre todas las canchas de césped sintético registradas."
        breadcrumbs={[
          { label: 'Resumen', href: '/admin' },
          { label: 'Copa Elite Forge' },
        ]}
      />

      {loadError && (
        <p className="mb-4 text-sm text-destructive">{loadError}</p>
      )}

      <CopaEliteForgeList matches={matches} />
    </div>
  )
}
