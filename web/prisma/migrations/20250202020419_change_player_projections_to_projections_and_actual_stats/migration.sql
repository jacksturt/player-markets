/*
  Warnings:

  - You are about to drop the `PlayerProjection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlayerProjection" DROP CONSTRAINT "PlayerProjection_playerId_fkey";

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "hasGameStarted" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "PlayerProjection";

-- CreateTable
CREATE TABLE "PlayerStatsAndProjection" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "projectedRushingAttempts" DOUBLE PRECISION NOT NULL,
    "projectedRushingYards" DOUBLE PRECISION NOT NULL,
    "projectedRushingTouchdowns" DOUBLE PRECISION NOT NULL,
    "projectedFumblesLost" DOUBLE PRECISION NOT NULL,
    "projectedCatches" DOUBLE PRECISION NOT NULL,
    "projectedReceivingYards" DOUBLE PRECISION NOT NULL,
    "projectedReceivingTouchdowns" DOUBLE PRECISION NOT NULL,
    "projectedPassingInterceptions" DOUBLE PRECISION NOT NULL,
    "projectedPassingYards" DOUBLE PRECISION NOT NULL,
    "projectedPassingTouchdowns" DOUBLE PRECISION NOT NULL,
    "projectedPassingSacks" DOUBLE PRECISION NOT NULL,
    "projectedFieldGoalsMade" DOUBLE PRECISION NOT NULL,
    "projectedFieldGoalsMissed" DOUBLE PRECISION NOT NULL,
    "projectedExtraPointKickingConversions" DOUBLE PRECISION NOT NULL,
    "projectedExtraPointKickingMisses" DOUBLE PRECISION NOT NULL,
    "projectedFantasyPointsHalfPpr" DOUBLE PRECISION NOT NULL,
    "projectedFantasyPointsPpr" DOUBLE PRECISION NOT NULL,
    "projectedFantasyPointsNonPpr" DOUBLE PRECISION NOT NULL,
    "actualRushingAttempts" DOUBLE PRECISION NOT NULL,
    "actualRushingYards" DOUBLE PRECISION NOT NULL,
    "actualRushingTouchdowns" DOUBLE PRECISION NOT NULL,
    "actualFumblesLost" DOUBLE PRECISION NOT NULL,
    "actualCatches" DOUBLE PRECISION NOT NULL,
    "actualReceivingYards" DOUBLE PRECISION NOT NULL,
    "actualReceivingTouchdowns" DOUBLE PRECISION NOT NULL,
    "actualPassingInterceptions" DOUBLE PRECISION NOT NULL,
    "actualPassingYards" DOUBLE PRECISION NOT NULL,
    "actualPassingTouchdowns" DOUBLE PRECISION NOT NULL,
    "actualPassingSacks" DOUBLE PRECISION NOT NULL,
    "actualFieldGoalsMade" DOUBLE PRECISION NOT NULL,
    "actualFieldGoalsMissed" DOUBLE PRECISION NOT NULL,
    "actualExtraPointKickingConversions" DOUBLE PRECISION NOT NULL,
    "actualExtraPointKickingMisses" DOUBLE PRECISION NOT NULL,
    "actualFantasyPointsHalfPpr" DOUBLE PRECISION NOT NULL,
    "actualFantasyPointsPpr" DOUBLE PRECISION NOT NULL,
    "actualFantasyPointsNonPpr" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlayerStatsAndProjection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStatsAndProjection_playerId_key" ON "PlayerStatsAndProjection"("playerId");

-- AddForeignKey
ALTER TABLE "PlayerStatsAndProjection" ADD CONSTRAINT "PlayerStatsAndProjection_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
