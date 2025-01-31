/*
  Warnings:

  - A unique constraint covering the columns `[sportsDataId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "sportsDataId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_sportsDataId_key" ON "Team"("sportsDataId");
