/*
  Warnings:

  - You are about to drop the column `buyTradeId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `sellTradeId` on the `Order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Trade_buyOrderId_key";

-- DropIndex
DROP INDEX "Trade_sellOrderId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "buyTradeId",
DROP COLUMN "sellTradeId";
