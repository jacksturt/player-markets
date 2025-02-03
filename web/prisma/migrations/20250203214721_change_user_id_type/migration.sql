/*
  Warnings:

  - A unique constraint covering the columns `[capsuleUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Network" AS ENUM ('DEVNET', 'MAINNET');

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "network" "Network" NOT NULL DEFAULT 'DEVNET';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "capsuleUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_capsuleUserId_key" ON "User"("capsuleUserId");
