-- DropIndex
DROP INDEX "matches_reservationId_key";

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "reservationId";

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "matchId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "reservations_matchId_key" ON "reservations"("matchId");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
