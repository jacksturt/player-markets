import { PlayerProjection } from "@/lib/types/sportsdata";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { sportsDataId, position, team, week, season } = await request.json();
  try {
    const response = await fetch(
      `https://baker-api.sportsdata.io/baker/v2/nfl/projections/players/${season}/${week}/team/${team}/avg?key=${process.env.SPORTSDATA_API_KEY}&position=${position}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ORACLE_API_KEY}`,
        },
      }
    );
    const data: PlayerProjection[] = await response.json();
    const player = await db.player.findUnique({
      where: {
        sportsDataId: sportsDataId,
      },
    });
    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }
    const playerProjectionData = data.find(
      (player) => player.player_id === sportsDataId
    );
    if (!playerProjectionData) {
      return NextResponse.json(
        { success: false, error: "Player projection not found" },
        { status: 404 }
      );
    }
    const camelCaseData =
      convertPlayerProjectionToCamelCase(playerProjectionData);
    console.log(data, camelCaseData);
    await db.playerProjection.upsert({
      where: {
        playerId: player.id,
      },
      update: {
        ...camelCaseData,
      },
      create: {
        playerId: player.id,
        ...camelCaseData,
      },
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function convertPlayerProjectionToCamelCase(projection: PlayerProjection) {
  return {
    rushingAttempts: projection.rushing_attempts,
    rushingYards: projection.rushing_yards,
    rushingTouchdowns: projection.rushing_touchdowns,
    fumblesLost: projection.fumbles_lost,
    catches: projection.catches,
    receivingYards: projection.receiving_yards,
    receivingTouchdowns: projection.receiving_touchdowns,
    passingInterceptions: projection.passing_interceptions,
    passingYards: projection.passing_yards,
    passingTouchdowns: projection.passing_touchdowns,
    passingSacks: projection.passing_sacks,
    fieldGoalsMade: projection.field_goals_made,
    fieldGoalsMissed: projection.field_goals_missed,
    extraPointKickingConversions: projection.extra_point_kicking_conversions,
    extraPointKickingMisses: projection.extra_point_kicking_misses,
    fantasyPointsHalfPpr: projection.fantasy_points_half_ppr,
    fantasyPointsPpr: projection.fantasy_points_ppr,
    fantasyPointsNonPpr: projection.fantasy_points_non_ppr,
  };
}
