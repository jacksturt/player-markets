import {
  PlayByPlayResponse,
  PlayStat,
  RawPlayData,
  ScoringPlay,
} from "@/lib/types/sportsdata";
import { db } from "@/server/db";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  if (
    request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json(
      { success: false, error: "Team ID is required" },
      { status: 400 }
    );
  }
  try {
    const team = await db.team.findUnique({
      where: {
        sportsDataId: teamId,
      },
      include: {
        players: {
          include: {
            mint: true,
            projections: true,
            market: true,
          },
        },
      },
    });

    const players = team?.players;
    if (!players) {
      return NextResponse.json(
        { success: false, error: "Players not found" },
        { status: 404 }
      );
    }

    const playersToSportsdataId = players.map((player) => ({
      id: player.id,
      sportsdataId: player.sportsDataId.toString(),
    }));

    const url = `https://api.sportsdata.io/v3/nfl/pbp/json/PlayByPlay/2024POST/4/${teamId}?key=1c17a32c80204a28a51e768c72ae0f60`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.ORACLE_API_KEY}`,
      },
    });
    const playByPlayResponse: PlayByPlayResponse = await response.json();

    if (!playByPlayResponse) {
      return NextResponse.json(
        { success: false, error: "Play by play response not found" },
        { status: 404 }
      );
    }
    for (const player of players) {
      const filteredPlays = playByPlayResponse.Plays.filter(
        (play) => play.PlayID > team.lastPlayID
      );

      for (const play of filteredPlays) {
        try {
          const rawPlay = convertRawPlayDataToPlayCreateInput(
            play,
            team.id,
            "cm6x74ayt0002rcp778yzmggt"
          );
          const createdPlay = await db.play.create({
            data: {
              ...rawPlay,
            },
          });
          if (play.ScoringPlay) {
            const scoringPlay = convertScoringPlayToActual(
              play.ScoringPlay,
              team.id
            );
            await db.scoringPlay.create({
              data: {
                ...scoringPlay,
                playId: createdPlay.id,
              },
            });
          }

          const playStats = play.PlayStats.map((stat) =>
            convertPlayerGameStatsToActual(
              stat,
              team.id,
              createdPlay.id,
              playersToSportsdataId
            )
          );
          await db.playStat.createMany({
            data: playStats,
          });
          await db.team.update({
            where: {
              id: team.id,
            },
            data: {
              lastPlayID: play.PlayID,
              plays: {
                connect: {
                  id: createdPlay.id,
                },
              },
              playStats: {
                connect: playStats.map((stat) => ({
                  playStatId: stat.playStatId,
                })),
              },
            },
          });

          for (const player of players) {
            const playerPlayStats = playStats.filter(
              (stat) => stat.playerId === player.sportsDataId.toString()
            );
            await db.player.update({
              where: { id: player.id },
              data: {
                playStats: {
                  connect: playerPlayStats.map((stat) => ({
                    playStatId: stat.playStatId,
                  })),
                },
              },
            });
          }
        } catch (error: any) {
          console.error(error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export type PlayCreateInput = {
  playId: number;
  quarterId: number;
  quarterName: string;
  sequence: number;
  timeRemainingMinutes: number;
  timeRemainingSeconds: number;
  playTime: Date;
  updated: Date;
  created: Date;
  teamId: string;
  opponentId: string;
  down: number;
  distance: number;
  yardLine: number;
  yardLineTerritory: string;
  yardsToEndZone: number;
  type: string;
  yardsGained: number;
  description: string;
  isScoringPlay: boolean;
};

function convertRawPlayDataToPlayCreateInput(
  rawPlay: RawPlayData,
  teamId: string,
  opponentId: string
): PlayCreateInput {
  return {
    playId: rawPlay.PlayID,
    quarterId: rawPlay.QuarterID,
    quarterName: rawPlay.QuarterName,
    sequence: rawPlay.Sequence,
    timeRemainingMinutes: rawPlay.TimeRemainingMinutes,
    timeRemainingSeconds: rawPlay.TimeRemainingSeconds,
    playTime: new Date(rawPlay.PlayTime),
    updated: new Date(rawPlay.Updated),
    created: new Date(rawPlay.Created),
    teamId: teamId,
    opponentId: opponentId,
    down: rawPlay.Down,
    distance: rawPlay.Distance,
    yardLine: rawPlay.YardLine,
    yardLineTerritory: rawPlay.YardLineTerritory,
    yardsToEndZone: rawPlay.YardsToEndZone,
    type: rawPlay.Type,
    yardsGained: rawPlay.YardsGained,
    description: rawPlay.Description,
    isScoringPlay: rawPlay.IsScoringPlay,
  };
}

export type PlayStatCreateInput = {
  playStatId: number;
  sequence: number;
  direction?: string | null;
  homeOrAway: string;
  playId: string;
  playerId?: string;
  teamId: string;
  passingAttempts: number;
  passingCompletions: number;
  passingYards: number;
  passingTouchdowns: number;
  passingInterceptions: number;
  passingSacks: number;
  passingSackYards: number;
  rushingAttempts: number;
  rushingYards: number;
  rushingTouchdowns: number;
  receivingTargets: number;
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;
  fumbles: number;
  fumblesLost: number;
  soloTackles: number;
  assistedTackles: number;
  tacklesForLoss: number;
  sacks: number;
  sackYards: number;
  passesDefended: number;
};

function convertPlayerGameStatsToActual(
  playStat: PlayStat,
  teamId: string,
  playId: string,
  playersToSportsdataId: { id: string; sportsdataId: string }[]
): PlayStatCreateInput {
  const player = playersToSportsdataId.find(
    (player) => player.sportsdataId === playStat.PlayerID.toString()
  );
  return {
    playStatId: playStat.PlayStatID,
    sequence: playStat.Sequence,
    direction: playStat.Direction,
    homeOrAway: playStat.HomeOrAway,
    playId: playId,
    playerId: player?.id,
    teamId: teamId,
    passingAttempts: playStat.PassingAttempts,
    passingCompletions: playStat.PassingCompletions,
    passingYards: playStat.PassingYards,
    passingTouchdowns: playStat.PassingTouchdowns,
    passingInterceptions: playStat.PassingInterceptions,
    passingSacks: playStat.PassingSacks,
    passingSackYards: playStat.PassingSackYards,
    rushingAttempts: playStat.RushingAttempts,
    rushingYards: playStat.RushingYards,
    rushingTouchdowns: playStat.RushingTouchdowns,
    receivingTargets: playStat.ReceivingTargets,
    receptions: playStat.Receptions,
    receivingYards: playStat.ReceivingYards,
    receivingTouchdowns: playStat.ReceivingTouchdowns,
    fumbles: playStat.Fumbles,
    fumblesLost: playStat.FumblesLost,
    soloTackles: playStat.SoloTackles,
    assistedTackles: playStat.AssistedTackles,
    tacklesForLoss: playStat.TacklesForLoss,
    sacks: playStat.Sacks,
    sackYards: playStat.SackYards,
    passesDefended: playStat.PassesDefended,
  };
}

export type ScoringPlayCreateInput = {
  scoringPlayId: number;
  gameKey: string;
  seasonType: number;
  season: number;
  week: number;
  date: Date;
  sequence: number;
  quarter: string;
  timeRemaining: string;
  playDescription: string;
  awayScore: number;
  homeScore: number;
  scoreId: number;
  teamId: string;
};

function convertScoringPlayToActual(
  scoringPlay: ScoringPlay,
  teamId: string
): ScoringPlayCreateInput {
  return {
    scoringPlayId: scoringPlay.ScoringPlayID,
    gameKey: scoringPlay.GameKey,
    seasonType: scoringPlay.SeasonType,
    season: scoringPlay.Season,
    week: scoringPlay.Week,
    date: new Date(scoringPlay.Date),
    sequence: scoringPlay.Sequence,
    quarter: scoringPlay.Quarter,
    timeRemaining: scoringPlay.TimeRemaining,
    playDescription: scoringPlay.PlayDescription,
    awayScore: scoringPlay.AwayScore,
    homeScore: scoringPlay.HomeScore,
    scoreId: scoringPlay.ScoreID,
    teamId: teamId,
  };
}
