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
  const teamId = searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json(
      { success: false, error: "Team ID is required" },
      { status: 400 }
    );
  }
  try {
    const players = await db.player.findMany({
      where: {
        team: {
          sportsDataId: teamId,
        },
      },
      include: {
        team: true,
        mint: true,
        projections: true,
        market: true,
      },
    });
    const url =
      teamId === "PHI"
        ? `https://api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByTeamFinal/2024POST/4/PHI?key=1c17a32c80204a28a51e768c72ae0f60`
        : "https://api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByTeamFinal/2024POST/4/KC?key=1c17a32c80204a28a51e768c72ae0f60";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.ORACLE_API_KEY}`,
      },
    });
    const playerActualDataList: PlayerGameStats[] = await response.json();
    if (!playerActualDataList) {
      return NextResponse.json(
        { success: false, error: "Player projection not found" },
        { status: 404 }
      );
    }

    for (const player of players) {
      const playerActualData = playerActualDataList.find(
        (data) => data.PlayerID === player.sportsDataId
      );
      console.log("playerActualData", playerActualData);

      if (!playerActualData) {
        console.error(`Player actual data not found for ${player.name}`);
        continue;
      }

      const camelCaseData = convertPlayerGameStatsToActual(playerActualData);

      if (
        player.projections?.actualFantasyPointsPpr !==
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
  isProjected: boolean
) {
  const connection = new Connection(process.env.RPC_URL!);
  const wallet = new EnvWallet();
  const provider = new AnchorProvider(connection, wallet);
  const programId = getTradetalkProgramId("mainnet-beta");
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
    .updateProjectionOracle(projection, isProjected)
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
