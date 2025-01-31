/*
  Warnings:

  - A unique constraint covering the columns `[sportsDataId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "sportsDataId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Player_sportsDataId_key" ON "Player"("sportsDataId");
