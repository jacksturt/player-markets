/*
  Warnings:

  - You are about to drop the column `capsuleUserId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paraUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_capsuleUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "capsuleUserId",
ADD COLUMN     "paraUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_paraUserId_key" ON "User"("paraUserId");
