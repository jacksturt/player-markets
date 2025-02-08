/*
  Warnings:

  - A unique constraint covering the columns `[marketId,sequenceNumber,userId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Order_marketId_sequenceNumber_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Order_marketId_sequenceNumber_userId_key" ON "Order"("marketId", "sequenceNumber", "userId");
