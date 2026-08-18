import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { ReservationDto, VenueDto } from '@ef/contracts';
import { ReservationStatus } from '@prisma/client';

@Injectable()
export class VenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOwner(ownerId: string): Promise<VenueDto[]> {
    return this.prisma.venue
      .findMany({
        where: { ownerId },
        orderBy: { name: 'asc' },
      })
      .then((rows) => rows.map((row) => this.toVenueDto(row)));
  }

  async upsertForOwner(
    ownerId: string,
    payload: {
      id?: string;
      name: string;
      address?: string | null;
      pricePerHourCents?: number;
    },
  ): Promise<VenueDto> {
    if (payload.id) {
      const updated = await this.prisma.venue.update({
        where: { id: payload.id, ownerId },
        data: {
          name: payload.name,
          address: payload.address ?? null,
          pricePerHourCents: payload.pricePerHourCents ?? 0,
        },
      });
      return this.toVenueDto(updated);
    }

    const created = await this.prisma.venue.create({
      data: {
        ownerId,
        name: payload.name,
        address: payload.address ?? null,
        pricePerHourCents: payload.pricePerHourCents ?? 0,
      },
    });
    return this.toVenueDto(created);
  }

  async listReservationsForOwner(ownerId: string): Promise<ReservationDto[]> {
    const venues = await this.prisma.venue.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const venueIds = venues.map((v) => v.id);
    if (venueIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.reservation.findMany({
      where: { venueId: { in: venueIds } },
      orderBy: { startsAt: 'desc' },
      take: 100,
    });

    return rows.map((row) => this.toReservationDto(row));
  }

  async updateReservationStatus(
    ownerId: string,
    reservationId: string,
    status: ReservationStatus,
  ): Promise<ReservationDto> {
    const venues = await this.prisma.venue.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const venueIds = venues.map((v) => v.id);
    if (venueIds.length === 0) {
      throw new NotFoundException('Reservation not found');
    }

    const result = await this.prisma.reservation.updateMany({
      where: {
        id: reservationId,
        venueId: { in: venueIds },
      },
      data: { status },
    });

    if (result.count === 0) {
      throw new NotFoundException('Reservation not found');
    }

    const updated = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: reservationId },
    });
    return this.toReservationDto(updated);
  }

  private toVenueDto(row: {
    id: string;
    ownerId: string;
    name: string;
    address: string | null;
    pricePerHourCents: number;
    availability: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): VenueDto {
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      address: row.address,
      pricePerHourCents: row.pricePerHourCents,
      availability: (row.availability as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toReservationDto(row: {
    id: string;
    userId: string;
    venueId: string | null;
    venueName: string;
    startsAt: Date;
    endsAt: Date;
    status: ReservationStatus;
    notes: string | null;
    createdAt: Date;
  }): ReservationDto {
    return {
      id: row.id,
      userId: row.userId,
      venueId: row.venueId,
      venueName: row.venueName,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      status: row.status,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
