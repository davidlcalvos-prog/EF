
-- CreateEnum
CREATE TYPE "CourtSize" AS ENUM ('five', 'six', 'seven', 'eight', 'eleven');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('app', 'phone', 'tournament', 'block');

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "courtId" UUID,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "source" "ReservationSource" NOT NULL DEFAULT 'app';

-- CreateTable
CREATE TABLE "courts" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "size" "CourtSize" NOT NULL,
    "surfaceType" "VenueSurfaceType",
    "pricePerHourCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courts_venueId_idx" ON "courts"("venueId");

-- CreateIndex
CREATE INDEX "reservations_courtId_idx" ON "reservations"("courtId");

-- AddForeignKey
ALTER TABLE "courts" ADD CONSTRAINT "courts_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

