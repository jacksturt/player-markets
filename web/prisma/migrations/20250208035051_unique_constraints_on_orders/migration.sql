-- CreateIndex
CREATE INDEX "Order_marketId_sequenceNumber_userId_idx" ON "Order"("marketId", "sequenceNumber", "userId");
