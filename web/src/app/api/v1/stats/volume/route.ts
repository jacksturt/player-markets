import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await prisma.$queryRaw<any>`
      SELECT
        -- Sum of all trade prices (total volume)
        SUM(price) AS "totalVolume",
        -- Sum of all trade prices in the last 24 hours
        SUM(CASE WHEN "createdAt" >= NOW() - INTERVAL '1 DAY' THEN price ELSE 0 END) AS "volumeLast24h",
        -- Sum of all trade prices in the last hour
        SUM(CASE WHEN "createdAt" >= NOW() - INTERVAL '1 HOUR' THEN price ELSE 0 END) AS "volumeLastHour",
        -- Count of distinct txId (total trades)
        COUNT(DISTINCT "txId") AS "tradeCount",
        -- Count of UserProfile rows where email is not null
        (SELECT COUNT(*) FROM "UserProfile" WHERE "email" IS NOT NULL) AS "realUserCount"
      FROM
        "Trade";
    `;

    const data = {
      totalVolume: Number(result[0].totalVolume),
      volumeLast24h: Number(result[0].volumeLast24h),
      volumeLastHour: Number(result[0].volumeLastHour),
      totalTrades: Number(result[0].tradeCount),
      realUserCount: Number(result[0].realUserCount)
    };

    console.log(data);
    return NextResponse.json(data);

  } catch(e) {
    console.error(e);
    return NextResponse.error();
  }
}