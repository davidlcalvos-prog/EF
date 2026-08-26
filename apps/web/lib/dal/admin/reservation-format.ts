/**
 * Helper puro de formato, separado de reservations.ts para que los client
 * components puedan importarlo sin arrastrar next/headers (server-client).
 */
export function formatReservationSchedule(startsAt: string, endsAt: string) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const date = start.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const startTime = start.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const endTime = end.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date} · ${startTime} – ${endTime}`
}
