/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `Mint` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Mint_address_key" ON "Mint"("address");
