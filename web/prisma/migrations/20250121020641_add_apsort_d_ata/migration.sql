/*
  Warnings:

  - The `sportsDataId` column on the `Player` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "sportsDataId",
ADD COLUMN     "sportsDataId" INTEGER NOT NULL DEFAULT 0;
