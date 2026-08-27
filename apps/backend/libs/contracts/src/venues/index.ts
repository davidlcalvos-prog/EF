import {
  IsBoolean,
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

/** Tamaño de una Court (Fase W.1) — distinto de TournamentCourtSize (ese solo tiene 3 valores). */
export type CourtSizeDto = 'five' | 'six' | 'seven' | 'eight' | 'eleven';
export const COURT_SIZE_VALUES: CourtSizeDto[] = ['five', 'six', 'seven', 'eight', 'eleven'];

/** Quién originó una reserva (Fase W.1). */
export type ReservationSourceDto = 'app' | 'phone' | 'tournament' | 'block';

export interface VenueDto {
  id: string;
  ownerId: string;
  name: string;
  address: string | null;
  /** "Precio desde" — mínimo entre las courts activas, calculado; ver A.3. Sin courts, es el valor viejo tal cual. */
  pricePerHourCents: number;
  availability: Record<string, unknown>;
  /** Null hasta que el owner lo complete desde "Mi cancha" — sin migración de datos existentes. */
  surfaceType: VenueSurfaceTypeDto | null;
  /** Fase W.1: canchas reales del complejo. [] si el owner todavía no cargó ninguna. */
  courts: CourtDto[];
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

// --- Courts (Fase W.1) ---

export interface CourtDto {
  id: string;
  name: string;
  size: CourtSizeDto;
  /** Null = hereda el surfaceType del Venue. */
  surfaceType: VenueSurfaceTypeDto | null;
  pricePerHourCents: number;
  isActive: boolean;
}

export class CreateCourtDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(COURT_SIZE_VALUES)
  size!: CourtSizeDto;

  @IsOptional()
  @IsEnum(['natural_grass', 'synthetic_grass', 'dirt_gravel', 'futsal_concrete'])
  surfaceType?: VenueSurfaceTypeDto;

  @IsInt()
  @Min(0)
  pricePerHourCents!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCourtPayload extends CreateCourtDto {
  @IsUUID()
  ownerId!: string;

  @IsUUID()
  venueId!: string;
}

export class UpdateCourtDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(COURT_SIZE_VALUES)
  size?: CourtSizeDto;

  @IsOptional()
  @IsEnum(['natural_grass', 'synthetic_grass', 'dirt_gravel', 'futsal_concrete'])
  surfaceType?: VenueSurfaceTypeDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerHourCents?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCourtPayload extends UpdateCourtDto {
  @IsUUID()
  ownerId!: string;

  @IsUUID()
  courtId!: string;
}

/** Desactivar es la única forma de "borrar" una court con reservas futuras — ver A.3. */
export class DeactivateCourtPayload {
  @IsUUID()
  ownerId!: string;

  @IsUUID()
  courtId!: string;
}

export interface ReservationDto {
  id: string;
  userId: string;
  /** Nombre del usuario dueño de la fila (para source=app, quién reservó desde mobile). Null si el usuario ya no existe. */
  userName: string | null;
  venueId: string | null;
  venueName: string;
  courtId: string | null;
  courtName: string | null;
  startsAt: string;
  endsAt: string;
  status: ReservationStatusDto;
  source: ReservationSourceDto;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  createdAt: string;
}

export class UpdateReservationStatusDto {
  @IsEnum(['confirmed', 'cancelled'])
  status!: 'confirmed' | 'cancelled';
}

export class UpdateReservationStatusPayload extends UpdateReservationStatusDto {
  @IsUUID()
  reservationId!: string;

  @IsUUID()
  ownerId!: string;
}

/** Reserva telefónica (lado dueño, Fase W.1) — nace confirmed, source=phone. */
export class CreatePhoneReservationDto {
  @IsUUID()
  courtId!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePhoneReservationPayload extends CreatePhoneReservationDto {
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
  /** Fase W.1: solo las courts activas — sin isActive/surfaceType, el jugador no los necesita. */
  courts: Array<{ id: string; name: string; size: CourtSizeDto; pricePerHourCents: number }>;
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
  /** Fase W.1: el jugador reserva una cancha puntual, no el venue completo. */
  @IsUUID()
  courtId!: string;

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
  courtId: string | null;
  courtName: string | null;
  startsAt: string;
  endsAt: string;
  status: ReservationStatusDto;
  notes: string | null;
  matchId: string | null;
  createdAt: string;
}
