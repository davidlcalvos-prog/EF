-- CreateEnum
CREATE TYPE "GroupFriendshipStatus" AS ENUM ('pending', 'accepted');

-- CreateTable
CREATE TABLE "group_friendships" (
    "id" UUID NOT NULL,
    "groupAId" UUID NOT NULL,
    "groupBId" UUID NOT NULL,
    "status" "GroupFriendshipStatus" NOT NULL DEFAULT 'pending',
    "requestedByGroupId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_friendships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_friendships_groupBId_idx" ON "group_friendships"("groupBId");

-- CreateIndex
CREATE UNIQUE INDEX "group_friendships_groupAId_groupBId_key" ON "group_friendships"("groupAId", "groupBId");

-- AddForeignKey
ALTER TABLE "group_friendships" ADD CONSTRAINT "group_friendships_groupAId_fkey" FOREIGN KEY ("groupAId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_friendships" ADD CONSTRAINT "group_friendships_groupBId_fkey" FOREIGN KEY ("groupBId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
