/*
  Warnings:

  - Added the required column `signature` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "signature" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "signature" TEXT NOT NULL;
