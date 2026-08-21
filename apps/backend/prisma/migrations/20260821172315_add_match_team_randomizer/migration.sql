-- CreateEnum
CREATE TYPE "MatchTeam" AS ENUM ('A', 'B');

-- AlterTable
ALTER TABLE "match_participants" ADD COLUMN     "team" "MatchTeam";

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "teamsRandomizedAt" TIMESTAMP(3);
