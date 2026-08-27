'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CourtRow } from '@/lib/dal/admin/types'
import { courtSizeLabel } from '@/lib/dal/admin/court-occupancy'

const HOUR_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 8)

export function toDateInputValue(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatHourOption(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:00 ${suffix}`
}

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'

export type PhoneReservationPayload = {
  court_id: string
  starts_at: string
  ends_at: string
  customer_name: string
  customer_phone?: string
  notes?: string
}

/** Modal de "reserva telefónica" (Fase W.1) — el owner elige una cancha real. */
export function AddReservationModal({
  open,
  onClose,
  onSave,
  courts,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  onSave: (payload: PhoneReservationPayload) => Promise<void>
  courts: CourtRow[]
  defaultDate: Date
}) {
  const activeCourts = courts.filter((c) => c.is_active)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [courtId, setCourtId] = useState(activeCourts[0]?.id ?? '')
  const [date, setDate] = useState(toDateInputValue(defaultDate))
  const [startHour, setStartHour] = useState(18)
  const [durationHours, setDurationHours] = useState(1)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Reinicia el formulario cada vez que el modal se abre. Se ajusta durante
  // el render (no en un efecto) para evitar un render extra en cada apertura.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setCustomerName('')
      setCustomerPhone('')
      setCourtId(activeCourts[0]?.id ?? '')
      setDate(toDateInputValue(defaultDate))
      setStartHour(18)
      setDurationHours(1)
      setNotes('')
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (customerName.trim().length < 2) {
      setError('Ingresa el nombre de quien reserva.')
      return
    }
    if (!courtId) {
      setError('Selecciona una cancha.')
      return
    }
    if (!date) {
      setError('Selecciona la fecha.')
      return
    }
    if (startHour + durationHours > 23) {
      setError('El horario debe terminar a las 10 PM o antes.')
      return
    }

    const [y, m, d] = date.split('-').map(Number)
    const starts = new Date(y, m - 1, d, startHour, 0, 0, 0)
    const ends = new Date(starts.getTime() + durationHours * 60 * 60 * 1000)

    setSaving(true)
    setError(null)
    try {
      await onSave({
        court_id: courtId,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear la reserva.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-form-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Reserva telefónica
            </p>
            <h2
              id="reservation-form-title"
              className="mt-1 font-heading text-2xl font-bold text-foreground"
            >
              Nueva reserva telefónica
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Para citas gestionadas por llamada (no vienen de la app). Queda
              confirmada de inmediato.
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

        {activeCourts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No hay canchas activas. Agregá al menos una en “Mi cancha” antes
            de crear reservas telefónicas.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nombre del cliente</Label>
              <Input
                id="customer_name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Pedro Sánchez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone">Teléfono (opcional)</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="300 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="court_id">Cancha</Label>
              <select
                id="court_id"
                className={selectClass}
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
              >
                {activeCourts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} — {courtSizeLabel(court.size)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_hour">Hora de inicio</Label>
                <select
                  id="start_hour"
                  className={selectClass}
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                >
                  {HOUR_OPTIONS.map((hour) => (
                    <option key={hour} value={hour} disabled={hour >= 22}>
                      {formatHourOption(hour)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duración</Label>
              <select
                id="duration"
                className={selectClass}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
              >
                <option value={1}>1 hora</option>
                <option value={2}>2 horas</option>
                <option value={3}>3 horas</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Pide balón prestado"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar reserva'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
