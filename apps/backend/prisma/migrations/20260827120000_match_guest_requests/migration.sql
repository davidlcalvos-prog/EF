
-- CreateEnum
CREATE TYPE "MatchGuestRequestStatus" AS ENUM ('open', 'filled', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "MatchGuestApplicationStatus" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- AlterTable
ALTER TABLE "match_participants" ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "notifyNearbyGuestRequests" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "match_guest_requests" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "requestedBy" UUID NOT NULL,
    "requestedPosition" TEXT,
    "radiusKm" INTEGER NOT NULL DEFAULT 15,
    "status" "MatchGuestRequestStatus" NOT NULL DEFAULT 'open',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_guest_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_guest_applications" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "MatchGuestApplicationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_guest_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_guest_requests_matchId_idx" ON "match_guest_requests"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "match_guest_applications_requestId_userId_key" ON "match_guest_applications"("requestId", "userId");

-- AddForeignKey
ALTER TABLE "match_guest_requests" ADD CONSTRAINT "match_guest_requests_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_guest_requests" ADD CONSTRAINT "match_guest_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_guest_applications" ADD CONSTRAINT "match_guest_applications_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "match_guest_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_guest_applications" ADD CONSTRAINT "match_guest_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

