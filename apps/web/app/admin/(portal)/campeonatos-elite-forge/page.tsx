import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/admin/session'
import { TournamentsDashboard } from '@/components/admin/tournaments-dashboard'
import { listEliteForgeTournamentsMine } from '@/lib/dal/admin/tournaments-api'

export default async function AdminCampeonatosEliteForgePage() {
  const session = await requireAdminSession()

  if (session.role !== 'Administrador') {
    redirect('/admin/reservas')
  }

  let tournaments: Awaited<ReturnType<typeof listEliteForgeTournamentsMine>> = []
  let loadError: string | null = null

  try {
    tournaments = await listEliteForgeTournamentsMine()
  } catch {
    loadError =
      'No se pudieron cargar los campeonatos. Verifica que el backend esté activo.'
  }

  return (
    <TournamentsDashboard
      kind="elite_forge"
      initialTournaments={tournaments}
      venues={[]}
      loadError={loadError}
    />
  )
}
