/*
  Warnings:

  - You are about to drop the column `lastFillSignature` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `lastOrderSignature` on the `Market` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Market" DROP COLUMN "lastFillSignature",
DROP COLUMN "lastOrderSignature";
