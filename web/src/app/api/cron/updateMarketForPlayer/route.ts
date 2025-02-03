import { PlayerGameStats, PlayerProjection } from "@/lib/types/sportsdata";
import { db } from "@/server/db";
import { program } from "@coral-xyz/anchor/dist/cjs/native/system";
import { Connection, PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getTradetalkProgram, getTradetalkProgramId } from "@project/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { EnvWallet } from "@/lib/envWallet";
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
  const playerId = searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json(
      { success: false, error: "Player ID is required" },
      { status: 400 }
    );
  }
  const season = "2024POST";
  const week = "4";
  try {
    const player = await db.player.findUniqueOrThrow({
      where: {
        id: playerId,
      },
      include: {
        team: true,
        mint: true,
        projections: true,
        market: true,
      },
    });

    try {
      if (player.market?.hasGameStarted) {
        const url = `https://api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByTeam/${season}/${week}/${player?.team?.sportsDataId}?key=${process.env.SPORTSDATA_API_KEY}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${process.env.ORACLE_API_KEY}`,
          },
        });
        const playerActualData: PlayerGameStats = await response.json();
        console.log("data", playerActualData);

        if (!playerActualData) {
          return NextResponse.json(
            { success: false, error: "Player projection not found" },
            { status: 404 }
          );
        }

        const camelCaseData = convertPlayerGameStatsToActual(playerActualData);
        if (
          player.projections?.projectedFantasyPointsPpr !==
          camelCaseData.actualFantasyPointsPpr
        ) {
          await db.playerStatsAndProjection.update({
            where: {
              playerId: player.id,
            },
            data: {
              ...camelCaseData,
            },
          });
          await updateProjectionOracle(
            player.sportsDataId.toString(),
            player.mint!.timestamp,
            camelCaseData.actualFantasyPointsPpr,
            false,
            false,
            false
          );
        }
      } else {
        const url = `https://baker-api.sportsdata.io/baker/v2/nfl/projections/players/${season}/${week}/team/${player?.team?.sportsDataId}/avg?key=${process.env.SPORTSDATA_API_KEY}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${process.env.ORACLE_API_KEY}`,
          },
        });
        const playerProjectionData: PlayerProjection = await response.json();
        console.log("data", playerProjectionData);

        if (!playerProjectionData) {
          return NextResponse.json(
            { success: false, error: "Player projection not found" },
            { status: 404 }
          );
        }

        const camelCaseData =
          convertPlayerProjectionToCamelCase(playerProjectionData);
        if (
          player.projections?.projectedFantasyPointsPpr !==
          camelCaseData.projectedFantasyPointsPpr
        ) {
          await db.playerStatsAndProjection.upsert({
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
          await updateProjectionOracle(
            player.sportsDataId.toString(),
            player.mint!.timestamp,
            playerProjectionData.fantasy_points_ppr,
            true,
            false,
            false
          );
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function convertPlayerProjectionToCamelCase(projection: PlayerProjection) {
  return {
    projectedRushingAttempts: projection.rushing_attempts,
    projectedRushingYards: projection.rushing_yards,
    projectedRushingTouchdowns: projection.rushing_touchdowns,
    projectedFumblesLost: projection.fumbles_lost,
    projectedCatches: projection.catches,
    projectedReceivingYards: projection.receiving_yards,
    projectedReceivingTouchdowns: projection.receiving_touchdowns,
    projectedPassingInterceptions: projection.passing_interceptions,
    projectedPassingYards: projection.passing_yards,
    projectedPassingTouchdowns: projection.passing_touchdowns,
    projectedPassingSacks: projection.passing_sacks,
    projectedFieldGoalsMade: projection.field_goals_made,
    projectedFieldGoalsMissed: projection.field_goals_missed,
    projectedExtraPointKickingConversions:
      projection.extra_point_kicking_conversions,
    projectedExtraPointKickingMisses: projection.extra_point_kicking_misses,
    projectedFantasyPointsHalfPpr: projection.fantasy_points_half_ppr,
    projectedFantasyPointsPpr: projection.fantasy_points_ppr,
    projectedFantasyPointsNonPpr: projection.fantasy_points_non_ppr,
  };
}

function convertPlayerGameStatsToActual(actual: PlayerGameStats) {
  return {
    actualRushingAttempts: actual.RushingAttempts,
    actualRushingYards: actual.RushingYards,
    actualRushingTouchdowns: actual.RushingTouchdowns,
    actualFumblesLost: actual.FumblesLost,
    actualCatches: actual.Receptions,
    actualReceivingYards: actual.ReceivingYards,
    actualReceivingTouchdowns: actual.ReceivingTouchdowns,
    actualPassingInterceptions: actual.PassingInterceptions,
    actualPassingYards: actual.PassingYards,
    actualPassingTouchdowns: actual.PassingTouchdowns,
    actualPassingSacks: actual.PassingSacks,
    actualFieldGoalsMade: actual.FieldGoalsMade,
    actualFieldGoalsMissed: actual.FieldGoalsAttempted - actual.FieldGoalsMade,
    actualExtraPointKickingConversions: actual.ExtraPointsMade,
    actualExtraPointKickingMisses:
      actual.ExtraPointsAttempted - actual.ExtraPointsMade,
    actualFantasyPointsHalfPpr:
      (actual.FantasyPointsPPR + actual.FantasyPoints) / 2,
    actualFantasyPointsPpr: actual.FantasyPointsPPR,
    actualFantasyPointsNonPpr: actual.FantasyPoints,
  };
}

function updateProjectionOracle(
  playerId: string,
  timestamp: string,
  projection: number,
  isProjected: boolean,
  setMintingDisabled: boolean,
  setPayoutEnabled: boolean
) {
  const connection = new Connection(process.env.ANCHOR_PROVIDER_URL!);
  const wallet = new EnvWallet();
  const provider = new AnchorProvider(connection, wallet);
  const programId = getTradetalkProgramId("devnet");
  const program = getTradetalkProgram(provider, programId);
  const mintConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from(playerId), Buffer.from(timestamp)],
    program.programId
  )[0];
  const playerStats = PublicKey.findProgramAddressSync(
    [
      Buffer.from("player_stats"),
      Buffer.from(playerId),
      Buffer.from(timestamp),
    ],
    program.programId
  )[0];
  return program.methods
    .updateProjectionOracle(
      projection,
      isProjected,
      setMintingDisabled,
      setPayoutEnabled
    )
    .accountsStrict({
      authority: provider.publicKey,
      config: mintConfig,
      playerStats,
    })
    .rpc()
    .catch((error) => {
      console.error(error);
    });
}
