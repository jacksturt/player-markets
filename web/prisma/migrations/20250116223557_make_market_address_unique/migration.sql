/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `Market` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Market_address_key" ON "Market"("address");
