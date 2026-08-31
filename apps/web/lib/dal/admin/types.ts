export type VenueSurfaceType =
  | 'natural_grass'
  | 'synthetic_grass'
  | 'dirt_gravel'
  | 'futsal_concrete'

export type CourtSize = 'five' | 'six' | 'seven' | 'eight' | 'eleven'

/** Servicios del complejo — misma lista que el venue-extras.ts pre-W.1, ahora en API. */
export type VenueAmenity = 'cafeteria' | 'transfers' | 'bathroom'

export type CourtRow = {
  id: string
  name: string
  size: CourtSize
  /** Null = hereda la superficie del complejo. */
  surface_type: VenueSurfaceType | null
  price_per_hour_cents: number
  is_active: boolean
}

export type VenueRow = {
  id: string
  owner_id: string
  name: string
  address: string | null
  /** "Desde" — mínimo entre canchas activas, o el valor crudo si aún no hay canchas. */
  price_per_hour_cents: number
  availability: Record<string, unknown>
  /** Null hasta que el owner lo complete desde "Mi cancha" (Fase 7.2). */
  surface_type: VenueSurfaceType | null
  /** Canchas del complejo (Fase W.1) — [] hasta que el owner agregue alguna. */
  courts: CourtRow[]
  /** Servicios del complejo — [] hasta que el owner los marque. */
  amenities: VenueAmenity[]
  /** Ubicación (Fase L.0): municipio DANE + centroide o pin del dueño. */
  municipality_code: string | null
  city: string | null
  department: string | null
  latitude: number | null
  longitude: number | null
  location_source: 'municipality' | 'pin' | null
  created_at: string
  updated_at: string
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

/** Estado que se puede setear vía PATCH — 'pending' ya no es un target válido. */
export type SettableReservationStatus = 'confirmed' | 'cancelled'

export type ReservationSource = 'app' | 'phone' | 'tournament' | 'block'

export type ReservationRow = {
  id: string
  user_id: string
  /** "Nombre Apellido" del jugador que reservó (source=app); null si no se pudo resolver. */
  user_name: string | null
  venue_id: string | null
  venue_name: string
  court_id: string | null
  court_name: string | null
  starts_at: string
  ends_at: string
  status: ReservationStatus
  source: ReservationSource
  /** Solo presentes cuando source='phone'. */
  customer_name: string | null
  customer_phone: string | null
  notes: string | null
  created_at: string
}
