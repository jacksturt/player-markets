/*
  Warnings:

  - The values [BUY,SELL] on the enum `OrderType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `isBid` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderType_new" AS ENUM ('LIMIT', 'IOC', 'POST_ONLY', 'GLOBAL');
ALTER TABLE "Order" ALTER COLUMN "type" TYPE "OrderType_new" USING ("type"::text::"OrderType_new");
ALTER TYPE "OrderType" RENAME TO "OrderType_old";
ALTER TYPE "OrderType_new" RENAME TO "OrderType";
DROP TYPE "OrderType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isBid" BOOLEAN NOT NULL;
