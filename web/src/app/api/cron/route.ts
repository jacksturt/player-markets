import { NextRequest, NextResponse } from "next/server";
import { syncBlockchainData } from "@/server/dbSync";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await syncBlockchainData();
    return NextResponse.json({ message: "Blockchain data synced" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error syncing blockchain data" }, { status: 500 });
  }
}