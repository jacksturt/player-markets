// app/api/db/handler/route.ts

import { OrderType } from "@prisma/client";
import { checkOrdersAndFills } from "@/server/handlers/checkOrdersAndFills";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (
    request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const { data } = await request.json();

  checkOrdersAndFills(data.marketAddress);
}
