-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "gameQuarter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quarterTimeRemaining" TEXT NOT NULL DEFAULT '00:00';
