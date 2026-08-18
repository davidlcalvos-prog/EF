-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('internal', 'vs');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('draft', 'pending_opponent', 'scheduled', 'played', 'cancelled');

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "originGroupId" UUID NOT NULL,
    "opponentGroupId" UUID,
    "type" "MatchType" NOT NULL,
    "format" TEXT NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "reservationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_participants" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matches_reservationId_key" ON "matches"("reservationId");

-- CreateIndex
CREATE INDEX "matches_originGroupId_idx" ON "matches"("originGroupId");

-- CreateIndex
CREATE INDEX "matches_opponentGroupId_idx" ON "matches"("opponentGroupId");

-- CreateIndex
CREATE INDEX "match_participants_userId_idx" ON "match_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "match_participants_matchId_userId_key" ON "match_participants"("matchId", "userId");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_originGroupId_fkey" FOREIGN KEY ("originGroupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_opponentGroupId_fkey" FOREIGN KEY ("opponentGroupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
