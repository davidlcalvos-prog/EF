-- CreateEnum
CREATE TYPE "MatchSide" AS ENUM ('origin', 'opponent');

-- AlterTable
ALTER TABLE "match_participants" ADD COLUMN     "side" "MatchSide";

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "rosterConfirmedAt" TIMESTAMP(3);
