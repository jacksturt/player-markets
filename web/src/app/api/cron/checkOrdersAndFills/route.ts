import { checkOrdersAndFills } from "@/server/handlers/checkOrdersAndFills";
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
  try {
    const { searchParams } = new URL(request.url);
    const marketAddress = searchParams.get("marketAddress");
    if (!marketAddress) {
      return NextResponse.json(
        { success: false, error: "Market address is required" },
        { status: 400 }
      );
    }
    await checkOrdersAndFills(marketAddress);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
