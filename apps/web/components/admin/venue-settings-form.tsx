'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { saveVenue } from '@/app/admin/(portal)/mi-cancha/actions'
import {
  DEFAULT_VENUE_EXTRAS,
  loadVenueExtras,
  saveVenueExtras,
  totalCourts,
  type VenueExtras,
} from '@/lib/dal/admin/venue-extras'

export type VenueFormBase = {
  id: string
  name: string
  address: string | null
  price_per_hour_cents: number
  surface_type: 'natural_grass' | 'synthetic_grass' | 'dirt_gravel' | 'futsal_concrete' | null
}

const SURFACE_TYPE_OPTIONS = [
  { value: 'natural_grass', label: 'Césped natural' },
  { value: 'synthetic_grass', label: 'Césped sintético' },
  { value: 'dirt_gravel', label: 'Tierra o gravilla' },
  { value: 'futsal_concrete', label: 'Cancha de sala / cemento' },
] as const

function AmenityToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        checked
          ? 'border-primary/50 bg-primary/10'
          : 'border-border bg-secondary/40 hover:border-border/80'
      }`}
    >
      <div>
        <p className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
          {label}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <span
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
          checked
            ? 'border-primary bg-primary/30 justify-end'
            : 'border-border bg-input justify-start'
        }`}
      >
        <span
          className={`mx-0.5 h-5 w-5 rounded-full ${
            checked ? 'bg-primary' : 'bg-muted-foreground'
          }`}
        />
      </span>
    </button>
  )
}

export function VenueSettingsForm({ venue }: { venue: VenueFormBase | null }) {
  const basePrice = venue ? Math.round(venue.price_per_hour_cents / 100) : 45000
  const [name, setName] = useState(venue?.name ?? '')
  const [address, setAddress] = useState(venue?.address ?? '')
  const [surfaceType, setSurfaceType] = useState(venue?.surface_type ?? '')
  const [extras, setExtras] = useState<VenueExtras>(() => ({
    ...DEFAULT_VENUE_EXTRAS,
    price6: basePrice,
  }))
  const [savedLocalHint, setSavedLocalHint] = useState(false)

  useEffect(() => {
    setExtras(loadVenueExtras(venue?.id, basePrice))
    setName(venue?.name ?? '')
    setAddress(venue?.address ?? '')
    setSurfaceType(venue?.surface_type ?? '')
  }, [venue?.id, venue?.name, venue?.address, venue?.surface_type, basePrice])

  const inventoryTotal = useMemo(() => totalCourts(extras), [extras])

  async function handleSubmit(formData: FormData) {
    saveVenueExtras(venue?.id, extras)
    setSavedLocalHint(true)
    await saveVenue(formData)
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="id" value={venue?.id ?? ''} />
      <input
        type="hidden"
        name="price_per_hour"
        value={extras.price6 || extras.price8 || extras.price11 || basePrice}
      />

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
            Identidad
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Nombre y ubicación visibles para jugadores.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la cancha</Label>
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Complejo El Estadio"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Calle, ciudad"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surface_type">Tipo de superficie</Label>
          <select
            id="surface_type"
            name="surface_type"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={surfaceType}
            onChange={(e) => setSurfaceType(e.target.value)}
          >
            <option value="">Sin especificar</option>
            {SURFACE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Solo las canchas de césped sintético entran al sorteo de partidos
            de Copa Elite Forge.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
            Inventario de canchas
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Cuántas canchas tienes de cada formato. Esto alimenta el Resumen
            (ocupadas / libres ahora).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              {
                key: 'courts6' as const,
                label: '6 vs 6',
                hint: 'Cantidad de canchas 6vs6',
              },
              {
                key: 'courts8' as const,
                label: '8 vs 8',
                hint: 'Cantidad de canchas 8vs8',
              },
              {
                key: 'courts11' as const,
                label: '11 vs 11',
                hint: 'Cantidad de canchas 11vs11',
              },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="space-y-2 rounded-xl border border-border/80 bg-secondary/30 p-4"
            >
              <Label htmlFor={item.key} className="font-heading uppercase">
                {item.label}
              </Label>
              <p className="text-[11px] text-muted-foreground">{item.hint}</p>
              <Input
                id={item.key}
                type="number"
                min={0}
                step={1}
                value={extras[item.key]}
                onChange={(e) =>
                  setExtras((prev) => ({
                    ...prev,
                    [item.key]: Math.max(0, Number(e.target.value || 0)),
                  }))
                }
              />
            </div>
          ))}
        </div>

        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          Total:{' '}
          <span className="font-heading text-lg font-bold text-primary">
            {inventoryTotal}
          </span>{' '}
          canchas · {extras.courts6}×6vs6 · {extras.courts8}×8vs8 ·{' '}
          {extras.courts11}×11vs11
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
            Tarifas por formato
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Precio por hora (COP) según el tamaño de cancha.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              { key: 'price6' as const, label: '6 vs 6', hint: 'Fútbol 6' },
              { key: 'price8' as const, label: '8 vs 8', hint: 'Fútbol 8' },
              { key: 'price11' as const, label: '11 vs 11', hint: 'Fútbol 11' },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="space-y-2 rounded-xl border border-border/80 bg-secondary/30 p-4"
            >
              <Label htmlFor={item.key} className="font-heading uppercase">
                {item.label}
              </Label>
              <p className="text-[11px] text-muted-foreground">{item.hint}</p>
              <Input
                id={item.key}
                type="number"
                min={0}
                step={1000}
                value={extras[item.key]}
                onChange={(e) =>
                  setExtras((prev) => ({
                    ...prev,
                    [item.key]: Number(e.target.value || 0),
                  }))
                }
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          El precio 6vs6 se sincroniza con el API como tarifa base. Inventario,
          8vs8, 11vs11 y servicios se guardan en este navegador.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-heading text-lg font-bold uppercase italic tracking-tight text-foreground">
            Servicios del complejo
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Amenidades que verán los jugadores al reservar.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-1">
          <AmenityToggle
            id="cafeteria"
            label="Cafetería"
            description="Snack bar o cafetería dentro del complejo"
            checked={extras.hasCafeteria}
            onChange={(v) => setExtras((p) => ({ ...p, hasCafeteria: v }))}
          />
          <AmenityToggle
            id="transfers"
            label="Transferencias"
            description="Acepta pagos por transferencia bancaria"
            checked={extras.hasTransfers}
            onChange={(v) => setExtras((p) => ({ ...p, hasTransfers: v }))}
          />
          <AmenityToggle
            id="bathroom"
            label="Baños"
            description="Baños disponibles para jugadores y acompañantes"
            checked={extras.hasBathroom}
            onChange={(v) => setExtras((p) => ({ ...p, hasBathroom: v }))}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="submit"
          className="h-11 font-heading font-semibold uppercase tracking-wide"
        >
          Guardar cancha
        </Button>
        {savedLocalHint && (
          <p className="text-xs text-primary">
            Inventario y extras guardados en este dispositivo. Tarifa 6vs6
            enviada al servidor.
          </p>
        )}
      </div>
    </form>
  )
}
