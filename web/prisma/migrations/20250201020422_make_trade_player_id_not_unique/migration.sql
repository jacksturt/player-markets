/*
  Warnings:

  - Made the column `playerId` on table `Trade` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_playerId_fkey";

-- DropIndex
DROP INDEX "Trade_playerId_key";

-- AlterTable
ALTER TABLE "Trade" ALTER COLUMN "playerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
