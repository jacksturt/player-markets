-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
    "playId" INTEGER NOT NULL,
    "quarterId" INTEGER NOT NULL,
    "quarterName" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "timeRemainingMinutes" INTEGER NOT NULL,
    "timeRemainingSeconds" INTEGER NOT NULL,
    "playTime" TIMESTAMP(3) NOT NULL,
    "updated" TIMESTAMP(3) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "down" INTEGER NOT NULL,
    "distance" INTEGER NOT NULL,
    "yardLine" INTEGER NOT NULL,
    "yardLineTerritory" TEXT NOT NULL,
    "yardsToEndZone" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "yardsGained" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "isScoringPlay" BOOLEAN NOT NULL,
    "scoringPlay" TEXT,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayStat" (
    "id" TEXT NOT NULL,
    "playStatId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "direction" TEXT,
    "homeOrAway" TEXT NOT NULL,
    "playId" TEXT NOT NULL,
    "playerId" TEXT,
    "teamId" TEXT NOT NULL,
    "passingAttempts" INTEGER NOT NULL DEFAULT 0,
    "passingCompletions" INTEGER NOT NULL DEFAULT 0,
    "passingYards" INTEGER NOT NULL DEFAULT 0,
    "passingTouchdowns" INTEGER NOT NULL DEFAULT 0,
    "passingInterceptions" INTEGER NOT NULL DEFAULT 0,
    "passingSacks" INTEGER NOT NULL DEFAULT 0,
    "passingSackYards" INTEGER NOT NULL DEFAULT 0,
    "rushingAttempts" INTEGER NOT NULL DEFAULT 0,
    "rushingYards" INTEGER NOT NULL DEFAULT 0,
    "rushingTouchdowns" INTEGER NOT NULL DEFAULT 0,
    "receivingTargets" INTEGER NOT NULL DEFAULT 0,
    "receptions" INTEGER NOT NULL DEFAULT 0,
    "receivingYards" INTEGER NOT NULL DEFAULT 0,
    "receivingTouchdowns" INTEGER NOT NULL DEFAULT 0,
    "fumbles" INTEGER NOT NULL DEFAULT 0,
    "fumblesLost" INTEGER NOT NULL DEFAULT 0,
    "soloTackles" INTEGER NOT NULL DEFAULT 0,
    "assistedTackles" INTEGER NOT NULL DEFAULT 0,
    "tacklesForLoss" INTEGER NOT NULL DEFAULT 0,
    "sacks" INTEGER NOT NULL DEFAULT 0,
    "sackYards" INTEGER NOT NULL DEFAULT 0,
    "passesDefended" INTEGER NOT NULL DEFAULT 0,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Play_playId_key" ON "Play"("playId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayStat_playStatId_key" ON "PlayStat"("playStatId");

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayStat" ADD CONSTRAINT "PlayStat_playId_fkey" FOREIGN KEY ("playId") REFERENCES "Play"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayStat" ADD CONSTRAINT "PlayStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayStat" ADD CONSTRAINT "PlayStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
