'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  addCourt,
  editCourt,
  removeCourt,
  saveVenue,
  searchMunicipalities,
} from '@/app/admin/(portal)/mi-cancha/actions'
import type { MunicipalityDto } from '@/lib/dal/admin/venues'
import type { CourtRow } from '@/lib/dal/admin/types'
import { VenueCourtsSection } from '@/components/admin/venue-courts-section'

// Leaflet toca window al importarse — solo en cliente.
const VenueLocationMap = dynamic(() => import('@/components/admin/venue-location-map'), {
  ssr: false,
})

export type VenueFormBase = {
  id: string
  name: string
  address: string | null
  price_per_hour_cents: number
  surface_type: 'natural_grass' | 'synthetic_grass' | 'dirt_gravel' | 'futsal_concrete' | null
  courts: CourtRow[]
  /** Ubicación (Fase L.0). */
  municipality_code: string | null
  city: string | null
  department: string | null
  latitude: number | null
  longitude: number | null
  location_source: 'municipality' | 'pin' | null
}

const SURFACE_TYPE_OPTIONS = [
  { value: 'natural_grass', label: 'Césped natural' },
  { value: 'synthetic_grass', label: 'Césped sintético' },
  { value: 'dirt_gravel', label: 'Tierra o gravilla' },
  { value: 'futsal_concrete', label: 'Cancha de sala / cemento' },
] as const

export function VenueSettingsForm({ venue }: { venue: VenueFormBase | null }) {
  const [name, setName] = useState(venue?.name ?? '')
  const [address, setAddress] = useState(venue?.address ?? '')
  const [surfaceType, setSurfaceType] = useState(venue?.surface_type ?? '')
  const [savedLocalHint, setSavedLocalHint] = useState(false)

  // ── Ubicación (Fase L.0) ──────────────────────────────────────────────
  const [municipality, setMunicipality] = useState<MunicipalityDto | null>(
    venue?.municipality_code && venue.city && venue.department
      ? {
          code: venue.municipality_code,
          name: venue.city,
          department: venue.department,
          lat: venue.latitude ?? 0,
          lng: venue.longitude ?? 0,
        }
      : null,
  )
  const [municipalityQuery, setMunicipalityQuery] = useState('')
  const [municipalityResults, setMunicipalityResults] = useState<MunicipalityDto[]>([])
  const [searchingMunicipality, setSearchingMunicipality] = useState(false)
  const [pin, setPin] = useState<[number, number] | null>(
    venue?.latitude != null && venue?.longitude != null
      ? [venue.latitude, venue.longitude]
      : null,
  )
  const [pinDirty, setPinDirty] = useState(false)
  const searchSeqRef = useRef(0)

  // Recarga el formulario cuando cambia la cancha mostrada (p. ej. tras
  // guardar una cancha nueva y recibir su id real desde el servidor).
  // Ajustar estado durante el render (no en un efecto) evita un render extra.
  const [loadedVenueId, setLoadedVenueId] = useState(venue?.id)
  if (venue?.id !== loadedVenueId) {
    setLoadedVenueId(venue?.id)
    setName(venue?.name ?? '')
    setAddress(venue?.address ?? '')
    setSurfaceType(venue?.surface_type ?? '')
    setMunicipality(
      venue?.municipality_code && venue.city && venue.department
        ? {
            code: venue.municipality_code,
            name: venue.city,
            department: venue.department,
            lat: venue.latitude ?? 0,
            lng: venue.longitude ?? 0,
          }
        : null,
    )
    setPin(
      venue?.latitude != null && venue?.longitude != null
        ? [venue.latitude, venue.longitude]
        : null,
    )
    setPinDirty(false)
    setMunicipalityQuery('')
    setMunicipalityResults([])
  }

  useEffect(() => {
    const term = municipalityQuery.trim()
    if (term.length < 2) {
      return
    }
    const seq = ++searchSeqRef.current
    const timer = setTimeout(() => {
      setSearchingMunicipality(true)
      searchMunicipalities(term)
        .then((results) => {
          if (searchSeqRef.current !== seq) return
          setMunicipalityResults(results)
        })
        .finally(() => {
          if (searchSeqRef.current === seq) setSearchingMunicipality(false)
        })
    }, 350)
    return () => clearTimeout(timer)
  }, [municipalityQuery])

  const municipalityQueryTerm = municipalityQuery.trim()
  const visibleMunicipalityResults =
    municipalityQueryTerm.length >= 2 ? municipalityResults : []
  const visibleSearchingMunicipality =
    municipalityQueryTerm.length >= 2 && searchingMunicipality

  const mapCenter: [number, number] | null = municipality
    ? pin ?? [municipality.lat, municipality.lng]
    : null

  /**
   * Coordenadas a enviar: solo si el dueño movió el pin en esta sesión, o si
   * la cancha ya tenía pin y no cambió de municipio (para no degradarlo).
   */
  const keepExistingPin =
    venue?.location_source === 'pin' &&
    municipality?.code === venue.municipality_code &&
    pin != null
  const submitPin = pinDirty || keepExistingPin ? pin : null

  async function handleSubmit(formData: FormData) {
    await saveVenue(formData)
    setSavedLocalHint(true)
  }

  return (
    <div className="space-y-8">
      <form action={handleSubmit} className="space-y-8">
        <input type="hidden" name="id" value={venue?.id ?? ''} />
        <input
          type="hidden"
          name="price_per_hour"
          value={venue ? Math.round(venue.price_per_hour_cents / 100) : 45000}
        />
        <input type="hidden" name="municipality_code" value={municipality?.code ?? ''} />
        <input type="hidden" name="latitude" value={submitPin ? String(submitPin[0]) : ''} />
        <input type="hidden" name="longitude" value={submitPin ? String(submitPin[1]) : ''} />

        <section className="space-y-4 rounded-2xl ef-card p-5">
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
            <Label htmlFor="municipality">Municipio</Label>
            {municipality ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-input/30 px-3 py-2">
                <span className="text-sm text-foreground">
                  {municipality.name}, {municipality.department}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMunicipality(null)
                    setPin(null)
                    setPinDirty(false)
                  }}
                  className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="municipality"
                  value={municipalityQuery}
                  onChange={(e) => setMunicipalityQuery(e.target.value)}
                  placeholder="Busca tu municipio (p. ej. Pereira)"
                  autoComplete="off"
                />
                {municipalityQueryTerm.length >= 2 ? (
                  <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                    {visibleSearchingMunicipality ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">Buscando…</p>
                    ) : visibleMunicipalityResults.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        No encontramos ese municipio.
                      </p>
                    ) : (
                      visibleMunicipalityResults.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setMunicipality(item)
                            setMunicipalityQuery('')
                            setMunicipalityResults([])
                            setPin([item.lat, item.lng])
                            setPinDirty(false)
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10"
                        >
                          {item.name}
                          <span className="text-muted-foreground"> — {item.department}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {municipality && mapCenter && pin ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Arrastrá el pin hasta la entrada de tu cancha. Si no lo movés, se
                usa el centro del municipio.
              </p>
              <VenueLocationMap
                center={mapCenter}
                pin={pin}
                onPinChange={(next) => {
                  setPin(next)
                  setPinDirty(true)
                }}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="surface_type">Tipo de superficie (del complejo)</Label>
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
              Cada cancha puede tener su propia superficie; esta es la que
              heredan si no especifican una. Solo las canchas de césped
              sintético entran al sorteo de partidos de Copa Elite Forge.
            </p>
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
            <p className="text-xs text-primary">Cambios guardados.</p>
          )}
        </div>
      </form>

      <VenueCourtsSection
        venueId={venue?.id ?? null}
        courts={venue?.courts ?? []}
        onAdd={(payload) => addCourt(venue!.id, payload)}
        onEdit={(courtId, payload) => editCourt(venue!.id, courtId, payload)}
        onDeactivate={(courtId) => removeCourt(venue!.id, courtId)}
      />
    </div>
  )
}
