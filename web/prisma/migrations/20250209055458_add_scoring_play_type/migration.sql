-- AlterTable
ALTER TABLE "PlayStat" ADD COLUMN     "scoringPlayId" TEXT;

-- CreateTable
CREATE TABLE "ScoringPlay" (
    "id" TEXT NOT NULL,
    "scoringPlayId" INTEGER NOT NULL,
    "gameKey" TEXT NOT NULL,
    "seasonType" INTEGER NOT NULL,
    "season" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "timeRemaining" TEXT NOT NULL,
    "playDescription" TEXT NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "scoreId" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "playId" TEXT,
    "playStatId" TEXT NOT NULL,

    CONSTRAINT "ScoringPlay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoringPlay_scoringPlayId_key" ON "ScoringPlay"("scoringPlayId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringPlay_scoreId_key" ON "ScoringPlay"("scoreId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringPlay_playStatId_key" ON "ScoringPlay"("playStatId");

-- AddForeignKey
ALTER TABLE "ScoringPlay" ADD CONSTRAINT "ScoringPlay_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringPlay" ADD CONSTRAINT "ScoringPlay_playId_fkey" FOREIGN KEY ("playId") REFERENCES "Play"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringPlay" ADD CONSTRAINT "ScoringPlay_playStatId_fkey" FOREIGN KEY ("playStatId") REFERENCES "PlayStat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
