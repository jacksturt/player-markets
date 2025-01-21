/*
  Warnings:

  - A unique constraint covering the columns `[marketId,sequenceNumber,userId,price,type,isBid,numBaseTokens,numQuoteTokens]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "projectionsId" TEXT,
ADD COLUMN     "sportsDataId" TEXT;

-- CreateTable
CREATE TABLE "PlayerProjection" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rushingAttempts" DOUBLE PRECISION NOT NULL,
    "rushingYards" DOUBLE PRECISION NOT NULL,
    "rushingTouchdowns" DOUBLE PRECISION NOT NULL,
    "fumblesLost" DOUBLE PRECISION NOT NULL,
    "catches" DOUBLE PRECISION NOT NULL,
    "receivingYards" DOUBLE PRECISION NOT NULL,
    "receivingTouchdowns" DOUBLE PRECISION NOT NULL,
    "passingInterceptions" DOUBLE PRECISION NOT NULL,
    "passingYards" DOUBLE PRECISION NOT NULL,
    "passingTouchdowns" DOUBLE PRECISION NOT NULL,
    "passingSacks" DOUBLE PRECISION NOT NULL,
    "fieldGoalsMade" DOUBLE PRECISION NOT NULL,
    "fieldGoalsMissed" DOUBLE PRECISION NOT NULL,
    "extraPointKickingConversions" DOUBLE PRECISION NOT NULL,
    "extraPointKickingMisses" DOUBLE PRECISION NOT NULL,
    "fantasyPointsHalfPpr" DOUBLE PRECISION NOT NULL,
    "fantasyPointsPpr" DOUBLE PRECISION NOT NULL,
    "fantasyPointsNonPpr" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlayerProjection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProjection_playerId_key" ON "PlayerProjection"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_marketId_sequenceNumber_userId_price_type_isBid_numBa_key" ON "Order"("marketId", "sequenceNumber", "userId", "price", "type", "isBid", "numBaseTokens", "numQuoteTokens");

-- AddForeignKey
ALTER TABLE "PlayerProjection" ADD CONSTRAINT "PlayerProjection_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
