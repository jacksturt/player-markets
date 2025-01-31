-- DropForeignKey
ALTER TABLE "Market" DROP CONSTRAINT "Market_baseMintId_fkey";

-- DropForeignKey
ALTER TABLE "Market" DROP CONSTRAINT "Market_playerId_fkey";

-- DropForeignKey
ALTER TABLE "Market" DROP CONSTRAINT "Market_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Mint" DROP CONSTRAINT "Mint_playerId_fkey";

-- DropForeignKey
ALTER TABLE "Mint" DROP CONSTRAINT "Mint_teamId_fkey";

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_baseMintId_fkey" FOREIGN KEY ("baseMintId") REFERENCES "Mint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mint" ADD CONSTRAINT "Mint_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mint" ADD CONSTRAINT "Mint_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
