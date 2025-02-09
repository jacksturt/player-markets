/*
  Warnings:

  - You are about to drop the column `scoringPlayId` on the `PlayStat` table. All the data in the column will be lost.
  - You are about to drop the column `playStatId` on the `ScoringPlay` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[playId]` on the table `ScoringPlay` will be added. If there are existing duplicate values, this will fail.
  - Made the column `playId` on table `ScoringPlay` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ScoringPlay" DROP CONSTRAINT "ScoringPlay_playId_fkey";

-- DropForeignKey
ALTER TABLE "ScoringPlay" DROP CONSTRAINT "ScoringPlay_playStatId_fkey";

-- DropIndex
DROP INDEX "ScoringPlay_playStatId_key";

-- AlterTable
ALTER TABLE "PlayStat" DROP COLUMN "scoringPlayId";

-- AlterTable
ALTER TABLE "ScoringPlay" DROP COLUMN "playStatId",
ALTER COLUMN "playId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ScoringPlay_playId_key" ON "ScoringPlay"("playId");

-- AddForeignKey
ALTER TABLE "ScoringPlay" ADD CONSTRAINT "ScoringPlay_playId_fkey" FOREIGN KEY ("playId") REFERENCES "Play"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
