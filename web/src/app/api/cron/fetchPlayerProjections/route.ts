import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { headers } from "next/headers";
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.URL || "http://localhost:3000";
export async function GET(request: Request) {
  // if (
  //   request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  // ) {
  //   return NextResponse.json(
  //     { success: false, error: "Unauthorized" },
  //     { status: 401 }
  //   );
  // }
  try {
    const players = await db.player.findMany({
      include: {
        team: true,
      },
    });
    console.log("players", players);
    for (const player of players) {
      fetch(`${baseUrl}/api/projections/updatePlayerProjections`, {
        method: "POST",
        body: JSON.stringify({
          sportsDataId: player.sportsDataId,
          position: player.position,
          team: player.team.sportsDataId,
          week: 1,
          season: "2024POST",
        }),
      })
        .then((res) => console.log(res))
        .catch((err) => console.error(err));
    }
    return NextResponse.json({ success: true, data: players });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
