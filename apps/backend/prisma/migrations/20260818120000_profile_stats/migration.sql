-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "favoritePosition" TEXT;

-- CreateTable
CREATE TABLE "player_stats" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "attack" INTEGER NOT NULL DEFAULT 0,
    "defense" INTEGER NOT NULL DEFAULT 0,
    "endurance" INTEGER NOT NULL DEFAULT 0,
    "speed" INTEGER NOT NULL DEFAULT 0,
    "passes" INTEGER NOT NULL DEFAULT 0,
    "dribbling" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_test_results" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "testId" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "psych_assessments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "answers" JSONB NOT NULL,
    "teamworkScore" INTEGER NOT NULL,
    "onFieldScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "traits" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "psych_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_stats_userId_key" ON "player_stats"("userId");

-- CreateIndex
CREATE INDEX "physical_test_results_userId_testId_idx" ON "physical_test_results"("userId", "testId");

-- CreateIndex
CREATE INDEX "psych_assessments_userId_idx" ON "psych_assessments"("userId");

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_test_results" ADD CONSTRAINT "physical_test_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "psych_assessments" ADD CONSTRAINT "psych_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
