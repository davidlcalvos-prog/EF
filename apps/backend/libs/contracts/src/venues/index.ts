import {
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export type ReservationStatusDto = 'pending' | 'confirmed' | 'cancelled';

/** Fase 7.2: solo synthetic_grass es elegible para el pool aleatorio de Copa Elite Forge. */
export type VenueSurfaceTypeDto =
  | 'natural_grass'
  | 'synthetic_grass'
  | 'dirt_gravel'
  | 'futsal_concrete';

/** Origen de las coordenadas de una cancha (Fase L.0). */
export type LocationSourceDto = 'municipality' | 'pin';

export interface VenueDto {
  id: string;
  ownerId: string;
  name: string;
  address: string | null;
  pricePerHourCents: number;
  availability: Record<string, unknown>;
  /** Null hasta que el owner lo complete desde "Mi cancha" — sin migración de datos existentes. */
  surfaceType: VenueSurfaceTypeDto | null;
  /** Ubicación (Fase L.0). Una cancha es pública: lat/lng sí se exponen. */
  municipalityCode: string | null;
  city: string | null;
  department: string | null;
  latitude: number | null;
  longitude: number | null;
  locationSource: LocationSourceDto | null;
  createdAt: string;
  updatedAt: string;
}

export class UpsertVenueDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerHourCents?: number;

  @IsOptional()
  @IsEnum(['natural_grass', 'synthetic_grass', 'dirt_gravel', 'futsal_concrete'])
  surfaceType?: VenueSurfaceTypeDto;

  /** Código DANE (Fase L.0); null limpia la ubicación. */
  @IsOptional()
  @ValidateIf((dto: UpsertVenueDto) => dto.municipalityCode !== null)
  @Matches(/^\d{5}$/, { message: 'municipalityCode must be a 5-digit DANE code' })
  municipalityCode?: string | null;

  /**
   * Pin preciso del dueño (solo canchas aceptan coordenadas del cliente).
   * Requiere municipalityCode y debe estar a <50 km del centroide.
   */
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}

export interface ReservationDto {
  id: string;
  userId: string;
  venueId: string | null;
  venueName: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatusDto;
  notes: string | null;
  createdAt: string;
}

export class UpdateReservationStatusDto {
  @IsEnum(['pending', 'confirmed', 'cancelled'])
  status!: ReservationStatusDto;
}

export class UpdateReservationStatusPayload extends UpdateReservationStatusDto {
  @IsUUID()
  reservationId!: string;

  @IsUUID()
  ownerId!: string;
}

export class UpsertVenuePayload extends UpsertVenueDto {
  @IsUUID()
  ownerId!: string;
}

export class OwnerPayload {
  @IsUUID()
  ownerId!: string;
}

// --- Lado jugador (Fase 4): buscar cancha y reservar, sin necesitar rol de dueño ---

/** Igual que VenueDto pero sin campos que solo le importan al dueño (ownerId, updatedAt). */
export interface PublicVenueDto {
  id: string;
  name: string;
  address: string | null;
  pricePerHourCents: number;
  availability: Record<string, unknown>;
  /** Ubicación (Fase L.0) — pública para canchas. */
  municipalityCode: string | null;
  city: string | null;
  department: string | null;
  latitude: number | null;
  longitude: number | null;
}

export class ListPublicVenuesPayload {
  /** Filtro opcional por municipio (Fase L.0, lo usa la sede de partidos). */
  @IsOptional()
  @Matches(/^\d{5}$/)
  municipalityCode?: string;
}

export class CreateReservationDto {
  @IsUUID()
  venueId!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Solo la puede setear el creator/admin del grupo del match — validado en el service. */
  @IsOptional()
  @IsUUID()
  matchId?: string;
}

export class CreateReservationPayload extends CreateReservationDto {
  @IsUUID()
  requesterId!: string;
}

/** GET detalle y PATCH cancel — ambos solo necesitan la reserva + quién pregunta. */
export class CancelReservationPayload {
  @IsUUID()
  reservationId!: string;

  @IsUUID()
  requesterId!: string;
}

export interface MyReservationDto {
  id: string;
  userId: string;
  venueId: string | null;
  venueName: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatusDto;
  notes: string | null;
  matchId: string | null;
  createdAt: string;
}
