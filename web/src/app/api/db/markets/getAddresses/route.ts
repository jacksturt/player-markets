// app/api/db/handler/route.ts

import { OrderType } from "@prisma/client";
import { checkOrdersAndFills } from "@/server/handlers/checkOrdersAndFills";
import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(request: Request) {
  if (
    request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const markets = await db.market.findMany({
    where: {
      network: "MAINNET",
    },
    select: {
      address: true,
    },
  });

  return NextResponse.json(markets.map((market) => market.address));
}
