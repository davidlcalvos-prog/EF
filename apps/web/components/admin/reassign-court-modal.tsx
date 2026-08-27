'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CourtRow, ReservationRow } from '@/lib/dal/admin/types'
import { courtSizeLabel } from '@/lib/dal/admin/court-occupancy'

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd
}

/** Libre = ninguna otra reserva no cancelada en esa cancha cruza el mismo rango. */
function isCourtFreeForReservation(
  courtId: string,
  reservation: ReservationRow,
  allReservations: ReservationRow[],
) {
  const start = new Date(reservation.starts_at)
  const end = new Date(reservation.ends_at)
  return !allReservations.some(
    (r) =>
      r.id !== reservation.id &&
      r.court_id === courtId &&
      r.status !== 'cancelled' &&
      rangesOverlap(start, end, new Date(r.starts_at), new Date(r.ends_at)),
  )
}

/**
 * Fase W.1.1: reasignación manual a otra cancha ACTIVA del MISMO tamaño
 * (ej. mantenimiento de último momento). El backend valida tamaño/solape de
 * nuevo; esto solo evita ofrecer opciones que ya se ven ocupadas.
 */
export function ReassignCourtModal({
  open,
  onClose,
  reservation,
  courts,
  allReservations,
  onReassign,
}: {
  open: boolean
  onClose: () => void
  reservation: ReservationRow
  courts: CourtRow[]
  allReservations: ReservationRow[]
  onReassign: (courtId: string) => Promise<void>
}) {
  const currentCourt = courts.find((c) => c.id === reservation.court_id) ?? null
  const sameSizeCourts = currentCourt
    ? courts.filter((c) => c.is_active && c.size === currentCourt.size)
    : []

  const [courtId, setCourtId] = useState(reservation.court_id ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setCourtId(reservation.court_id ?? '')
      setError(null)
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleConfirm() {
    if (!courtId || courtId === reservation.court_id) return
    setSaving(true)
    setError(null)
    try {
      await onReassign(courtId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reasignar la cancha.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reassign-court-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Reasignar cancha
            </p>
            <h2
              id="reassign-court-title"
              className="mt-1 font-heading text-xl font-bold text-foreground"
            >
              {currentCourt ? courtSizeLabel(currentCourt.size) : 'Cancha'}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Solo canchas activas del mismo tamaño. El jugador recibirá un
              aviso con la nueva cancha.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sameSizeCourts.length <= 1 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No hay otra cancha activa de este tamaño para reasignar.
          </p>
        ) : (
          <div className="space-y-2">
            {sameSizeCourts.map((court) => {
              const isCurrent = court.id === reservation.court_id
              const free =
                isCurrent || isCourtFreeForReservation(court.id, reservation, allReservations)
              return (
                <label
                  key={court.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm transition ${
                    courtId === court.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  } ${!free ? 'opacity-50' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="reassign-court"
                      value={court.id}
                      checked={courtId === court.id}
                      disabled={!free}
                      onChange={() => setCourtId(court.id)}
                    />
                    <span className="font-medium text-foreground">{court.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase text-muted-foreground">
                        (actual)
                      </span>
                    )}
                  </span>
                  {!isCurrent && (
                    <span
                      className={
                        free ? 'text-xs font-semibold text-primary' : 'text-xs text-muted-foreground'
                      }
                    >
                      {free ? 'Libre' : 'Ocupada'}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saving || !courtId || courtId === reservation.court_id}
            onClick={handleConfirm}
          >
            {saving ? 'Reasignando…' : 'Reasignar'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
