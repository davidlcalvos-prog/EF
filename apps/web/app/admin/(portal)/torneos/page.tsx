import { requireAdminSession } from '@/lib/admin/session'
import { TournamentsDashboard } from '@/components/admin/tournaments-dashboard'
import { listMyVenues } from '@/lib/dal/admin/venues'
import { listTournamentsMine } from '@/lib/dal/admin/tournaments-api'
import { redirect } from 'next/navigation'

export default async function AdminTorneosPage() {
  const session = await requireAdminSession()

  if (session.role === 'Administrador') {
    redirect('/admin/metricas')
  }

  let tournaments: Awaited<ReturnType<typeof listTournamentsMine>> = []
  let venues: Awaited<ReturnType<typeof listMyVenues>> = []
  let loadError: string | null = null

  try {
    ;[tournaments, venues] = await Promise.all([
      listTournamentsMine(),
      listMyVenues(session.user.id),
    ])
  } catch {
    loadError =
      'No se pudieron cargar los torneos. Verifica que el backend esté activo.'
  }

  return (
    <TournamentsDashboard
      initialTournaments={tournaments}
      venues={venues}
      loadError={loadError}
    />
  )
}
