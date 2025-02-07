import { GameData } from "@/lib/types/sportsdata";
import { db } from "@/server/db";
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

  try {
    // const url = `https://api.sportsdata.io/v3/nfl/stats/json/BoxScoreV3/2024POST/4/PHI?key=${process.env.SPORTSDATA_API_KEY}`;
    const url = `https://replay.sportsdata.io/api/v3/nfl/stats/json/boxscorev3/2023post/3/det?key=d6f0c46073bf4bf2a70d2d6b01f74046`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.ORACLE_API_KEY}`,
      },
    });
    const gameDataActual: GameData = await response.json();
    if (!gameDataActual) {
      return NextResponse.json(
        { success: false, error: "Player projection not found" },
        { status: 404 }
      );
    }

    const homeTeamId = gameDataActual.Score.HomeTeam;
    const homeTeamScore = gameDataActual.Score.HomeScore;
    const awayTeamId = gameDataActual.Score.AwayTeam;
    const awayTeamScore = gameDataActual.Score.AwayScore;

    const homeTeam = await db.team.findUniqueOrThrow({
      where: {
        sportsDataId: homeTeamId.toString(),
      },
      include: {
        stats: true,
        mint: true,
      },
    });

    const awayTeam = await db.team.findUniqueOrThrow({
      where: {
        sportsDataId: awayTeamId.toString(),
      },
      include: {
        stats: true,
        mint: true,
      },
    });

    if (homeTeam.stats?.actualPoints.toNumber() !== homeTeamScore) {
      await db.teamStats.update({
        where: {
          teamId: homeTeam.id,
        },
        data: {
          actualPoints: homeTeamScore,
        },
      });
      await updateProjectionOracle(
        homeTeam.sportsDataId.toString(),
        homeTeam.mint!.timestamp,
        homeTeamScore,
        false
      );
    }
    if (awayTeam.stats?.actualPoints.toNumber() !== awayTeamScore) {
      await db.teamStats.update({
        where: {
          teamId: awayTeam.id,
        },
        data: {
          actualPoints: awayTeamScore,
        },
      });
      await updateProjectionOracle(
        awayTeam.sportsDataId.toString(),
        awayTeam.mint!.timestamp,
        awayTeamScore,
        false
      );
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
