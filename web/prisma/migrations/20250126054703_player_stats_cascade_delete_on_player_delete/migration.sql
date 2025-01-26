-- DropForeignKey
ALTER TABLE "PlayerProjection" DROP CONSTRAINT "PlayerProjection_playerId_fkey";

-- AddForeignKey
ALTER TABLE "PlayerProjection" ADD CONSTRAINT "PlayerProjection_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
