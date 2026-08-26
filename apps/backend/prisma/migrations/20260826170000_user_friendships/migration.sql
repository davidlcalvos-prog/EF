
-- CreateEnum
CREATE TYPE "UserFriendshipStatus" AS ENUM ('pending', 'accepted');

-- CreateTable
CREATE TABLE "user_friendships" (
    "id" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "addresseeId" UUID NOT NULL,
    "status" "UserFriendshipStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_friendships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_friendships_addresseeId_status_idx" ON "user_friendships"("addresseeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_friendships_requesterId_addresseeId_key" ON "user_friendships"("requesterId", "addresseeId");

-- AddForeignKey
ALTER TABLE "user_friendships" ADD CONSTRAINT "user_friendships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_friendships" ADD CONSTRAINT "user_friendships_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

