import { requireAdminSession } from '@/lib/admin/session'
import { AdminPageHeader } from '@/components/admin/page-header'
import { redirect } from 'next/navigation'

export default async function AdminMetricasPage() {
  const session = await requireAdminSession()

  if (session.role === 'Empresario') {
    redirect('/admin/reservas')
  }

  const kpis = [
    { label: 'Jugadores activos', value: '—' },
    { label: 'Partidos este mes', value: '—' },
    { label: 'Goles registrados', value: '—' },
    { label: 'Equipos activos', value: '—' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <AdminPageHeader
        title="Métricas"
        subtitle="Panel para empresarios e inversores. Conectaremos datos agregados de jugadores y partidos."
        breadcrumbs={[
          { label: 'Resumen', href: '/admin' },
          { label: 'Métricas' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        Próximamente: agregaciones desde partidos, perfiles y equipos en
        PostgreSQL. Este módulo está reservado para el rol Administrador.
      </p>
    </div>
  )
}
