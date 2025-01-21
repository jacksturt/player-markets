import { PlayerProjection } from "@/lib/types/sportsdata";
import { db } from "@/server/db";
import { program } from "@coral-xyz/anchor/dist/cjs/native/system";
import { Connection, PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getTradetalkProgram, getTradetalkProgramId } from "@project/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { EnvWallet } from "@/lib/envWallet";

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
      include: {
        mint: true,
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
    await updateProjectionOracle(
      player.sportsDataId.toString(),
      player.mint!.timestamp,
      playerProjectionData.fantasy_points_ppr
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error(error);
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

function updateProjectionOracle(
  playerId: string,
  timestamp: string,
  projection: number
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
    .updateProjectionOracle(projection)
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
