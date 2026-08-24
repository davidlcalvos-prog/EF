-- CreateEnum
CREATE TYPE "VenueSurfaceType" AS ENUM ('natural_grass', 'synthetic_grass', 'dirt_gravel', 'futsal_concrete');

-- CreateEnum
CREATE TYPE "TournamentKind" AS ENUM ('private', 'elite_forge');

-- AlterTable
ALTER TABLE "tournament_matches" ADD COLUMN     "venueId" UUID;

-- AlterTable
ALTER TABLE "tournament_players" ADD COLUMN     "userId" UUID;

-- AlterTable
ALTER TABLE "tournament_teams" ADD COLUMN     "enrolledGroupId" UUID;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "kind" "TournamentKind" NOT NULL DEFAULT 'private',
ALTER COLUMN "venueId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "surfaceType" "VenueSurfaceType";

-- CreateIndex
CREATE INDEX "tournament_matches_venueId_idx" ON "tournament_matches"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_teams_tournamentId_enrolledGroupId_key" ON "tournament_teams"("tournamentId", "enrolledGroupId");

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_enrolledGroupId_fkey" FOREIGN KEY ("enrolledGroupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

