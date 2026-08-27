'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CourtRow, CourtSize, VenueSurfaceType } from '@/lib/dal/admin/types'
import { eliteForgeColors } from '@/lib/theme/elite-forge'

const SIZE_OPTIONS: { value: CourtSize; label: string }[] = [
  { value: 'five', label: '5 vs 5' },
  { value: 'six', label: '6 vs 6' },
  { value: 'seven', label: '7 vs 7' },
  { value: 'eight', label: '8 vs 8' },
  { value: 'eleven', label: '11 vs 11' },
]

const SURFACE_OPTIONS = [
  { value: 'natural_grass', label: 'Césped natural' },
  { value: 'synthetic_grass', label: 'Césped sintético' },
  { value: 'dirt_gravel', label: 'Tierra o gravilla' },
  { value: 'futsal_concrete', label: 'Cancha de sala / cemento' },
] as const

function sizeLabel(size: CourtSize) {
  return SIZE_OPTIONS.find((o) => o.value === size)?.label ?? size
}

function surfaceLabel(surface: VenueSurfaceType | null) {
  if (!surface) return 'Hereda del complejo'
  return SURFACE_OPTIONS.find((o) => o.value === surface)?.label ?? surface
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'

type CourtDraft = {
  name: string
  size: CourtSize
  surface_type: VenueSurfaceType | ''
  price: string
}

const EMPTY_DRAFT: CourtDraft = {
  name: '',
  size: 'six',
  surface_type: '',
  price: '',
}

function CourtFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: 'add' | 'edit'
  initial?: CourtRow | null
  onClose: () => void
  onSubmit: (draft: CourtDraft) => Promise<void>
}) {
  const [draft, setDraft] = useState<CourtDraft>(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reinicia el formulario cada vez que el modal se abre. Se ajusta durante
  // el render (no en un efecto) para evitar un render extra en cada apertura.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      if (mode === 'edit' && initial) {
        setDraft({
          name: initial.name,
          size: initial.size,
          surface_type: initial.surface_type ?? '',
          price: String(Math.round(initial.price_per_hour_cents / 100)),
        })
      } else {
        setDraft(EMPTY_DRAFT)
      }
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
    if (draft.name.trim().length < 2) {
      setError('Ingresá un nombre para la cancha.')
      return
    }
    const price = Number(draft.price)
    if (!Number.isFinite(price) || price <= 0) {
      setError('Ingresá un precio por hora válido.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(draft)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar la cancha.',
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
      aria-labelledby="court-form-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="court-form-title"
            className="font-heading text-xl font-bold text-foreground"
          >
            {mode === 'edit' ? 'Editar cancha' : 'Nueva cancha'}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="court_name">Nombre</Label>
            <Input
              id="court_name"
              required
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Cancha 1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="court_size">Formato</Label>
              <select
                id="court_size"
                className={selectClass}
                value={draft.size}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, size: e.target.value as CourtSize }))
                }
              >
                {SIZE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="court_price">Precio/hora (COP)</Label>
              <Input
                id="court_price"
                type="number"
                min={0}
                step={1000}
                required
                value={draft.price}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, price: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="court_surface">Superficie</Label>
            <select
              id="court_surface"
              className={selectClass}
              value={draft.surface_type}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  surface_type: e.target.value as VenueSurfaceType | '',
                }))
              }
            >
              <option value="">Hereda del complejo</option>
              {SURFACE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Guardando…'
                : mode === 'edit'
                  ? 'Guardar cambios'
                  : 'Agregar cancha'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function VenueCourtsSection({
  venueId,
  courts,
  onAdd,
  onEdit,
  onDeactivate,
}: {
  venueId: string | null
  courts: CourtRow[]
  onAdd: (payload: {
    name: string
    size: CourtSize
    surface_type?: VenueSurfaceType | null
    price_per_hour_cents: number
  }) => Promise<CourtRow>
  onEdit: (
    courtId: string,
    payload: {
      name?: string
      size?: CourtSize
      surface_type?: VenueSurfaceType | null
      price_per_hour_cents?: number
      is_active?: boolean
    },
  ) => Promise<CourtRow>
  onDeactivate: (courtId: string) => Promise<CourtRow>
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [editingCourt, setEditingCourt] = useState<CourtRow | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  function openAdd() {
    setFormMode('add')
    setEditingCourt(null)
    setRowError(null)
    setFormOpen(true)
  }

  function openEdit(court: CourtRow) {
    setFormMode('edit')
    setEditingCourt(court)
    setRowError(null)
    setFormOpen(true)
  }

  async function handleSubmit(draft: CourtDraft) {
    const payload = {
      name: draft.name.trim(),
      size: draft.size,
      surface_type: draft.surface_type || null,
      price_per_hour_cents: Math.round(Number(draft.price) * 100),
    }
    if (formMode === 'edit' && editingCourt) {
      await onEdit(editingCourt.id, payload)
    } else {
      await onAdd(payload)
    }
  }

  async function handleReactivate(court: CourtRow) {
    setRowError(null)
    setBusyId(court.id)
    try {
      await onEdit(court.id, { is_active: true })
    } catch (err) {
      setRowError(
        err instanceof Error ? err.message : 'No se pudo reactivar la cancha.',
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeactivate(court: CourtRow) {
    if (!window.confirm(`¿Desactivar "${court.name}"?`)) return
    setRowError(null)
    setBusyId(court.id)
    try {
      await onDeactivate(court.id)
    } catch (err) {
      setRowError(
        err instanceof Error
          ? err.message
          : 'No se pudo desactivar la cancha.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl ef-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
            Mis canchas
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Cada cancha tiene su propio formato, precio y superficie.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!venueId}
          onClick={openAdd}
          className="font-heading uppercase tracking-wide"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar cancha
        </Button>
      </div>

      {!venueId && (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Guardá primero el nombre de tu cancha para poder agregar canchas.
        </p>
      )}

      {venueId && courts.length === 0 && (
        <p
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: `${eliteForgeColors.orange}55`,
            backgroundColor: `${eliteForgeColors.orange}1a`,
            color: eliteForgeColors.orange,
          }}
        >
          Agregá al menos una cancha para empezar a recibir reservas.
        </p>
      )}

      {rowError && <p className="text-sm text-destructive">{rowError}</p>}

      {courts.length > 0 && (
        <ul className="space-y-3">
          {courts.map((court) => (
            <li
              key={court.id}
              className="flex flex-col gap-3 rounded-xl border border-border/80 bg-secondary/25 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
                  {court.name}
                  {!court.is_active && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Inactiva
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sizeLabel(court.size)} · {surfaceLabel(court.surface_type)} ·{' '}
                  {formatPrice(court.price_per_hour_cents)}/h
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!court.is_active && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === court.id}
                    onClick={() => handleReactivate(court)}
                  >
                    Reactivar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Editar ${court.name}`}
                  onClick={() => openEdit(court)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {court.is_active && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Desactivar ${court.name}`}
                    disabled={busyId === court.id}
                    onClick={() => handleDeactivate(court)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <CourtFormModal
        open={formOpen}
        mode={formMode}
        initial={editingCourt}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
