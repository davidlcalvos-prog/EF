import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export type ReservationStatusDto = 'pending' | 'confirmed' | 'cancelled';

/** Fase 7.2: solo synthetic_grass es elegible para el pool aleatorio de Copa Elite Forge. */
export type VenueSurfaceTypeDto =
  | 'natural_grass'
  | 'synthetic_grass'
  | 'dirt_gravel'
  | 'futsal_concrete';

export interface VenueDto {
  id: string;
  ownerId: string;
  name: string;
  address: string | null;
  pricePerHourCents: number;
  availability: Record<string, unknown>;
  /** Null hasta que el owner lo complete desde "Mi cancha" — sin migración de datos existentes. */
  surfaceType: VenueSurfaceTypeDto | null;
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
