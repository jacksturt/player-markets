/*
  Warnings:

  - Added the required column `mintSlug` to the `Mint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `Mint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mint" ADD COLUMN     "mintSlug" TEXT NOT NULL,
ADD COLUMN     "timestamp" TEXT NOT NULL;
