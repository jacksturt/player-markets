-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_playerId_fkey";

-- DropIndex
DROP INDEX "Trade_teamId_key";

-- AlterTable
ALTER TABLE "Trade" ALTER COLUMN "playerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
