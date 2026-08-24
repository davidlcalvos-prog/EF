-- CreateEnum
CREATE TYPE "TournamentCourtSize" AS ENUM ('six_vs_six', 'eight_vs_eight', 'eleven_vs_eleven');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('groups_of_4', 'round_robin', 'brackets');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'registration', 'active', 'finished');

-- CreateEnum
CREATE TYPE "TournamentMatchStatus" AS ENUM ('scheduled', 'played', 'walkover_home', 'walkover_away');

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "tournamentMatchId" UUID;

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "courtSize" "TournamentCourtSize" NOT NULL,
    "format" "TournamentFormat" NOT NULL,
    "maxTeams" INTEGER NOT NULL,
    "bracketKeys" INTEGER NOT NULL,
    "extraRoundEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "TournamentStatus" NOT NULL DEFAULT 'registration',
    "schedule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_teams" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "lossesByW" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_players" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isGoalkeeper" BOOLEAN NOT NULL DEFAULT false,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "dfr" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tournament_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "roundLabel" TEXT NOT NULL,
    "keyIndex" INTEGER NOT NULL,
    "homeTeamId" UUID NOT NULL,
    "awayTeamId" UUID NOT NULL,
    "homeGoals" INTEGER,
    "awayGoals" INTEGER,
    "status" "TournamentMatchStatus" NOT NULL DEFAULT 'scheduled',
    "playerStats" JSONB NOT NULL DEFAULT '[]',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "courtNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournaments_ownerId_idx" ON "tournaments"("ownerId");

-- CreateIndex
CREATE INDEX "tournaments_venueId_idx" ON "tournaments"("venueId");

-- CreateIndex
CREATE INDEX "tournament_teams_tournamentId_idx" ON "tournament_teams"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_players_teamId_idx" ON "tournament_players"("teamId");

-- CreateIndex
CREATE INDEX "tournament_matches_tournamentId_idx" ON "tournament_matches"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_tournamentMatchId_key" ON "reservations"("tournamentMatchId");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_tournamentMatchId_fkey" FOREIGN KEY ("tournamentMatchId") REFERENCES "tournament_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

