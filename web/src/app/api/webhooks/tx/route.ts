import { NextRequest, NextResponse } from "next/server";
import { processBurnTx, processClaimCuratorRewardsTx, processLaunchTx, processMintTx } from "@/server/dbSync";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log("webhook received");
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== 'bangbang') {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    console.log('body', body);
    const data = body[0];
    const meta = data.meta;
    const logs = meta.logMessages.join('\n');

    const isMintTx = String(logs).includes("Instruction: Mint");
    const isBurnTx = String(logs).includes("Instruction: Burn");
    const isLaunchTx = String(logs).includes("Instruction: LaunchMarket");
    const isClaimCuratorRewardsTx = String(logs).includes("Instruction: ClaimCuratorRewards");

    console.log(data);
    const isValidTx = isMintTx || isBurnTx || isLaunchTx || isClaimCuratorRewardsTx;

    if (!isValidTx) {
      return NextResponse.json({ message: "Not mint or burn or launch or claim curator rewards tx" }, { status: 200 });
    }

    console.log("valid tx");

    if (isMintTx) {
      console.log("mint tx");
      const { message, status } = await processMintTx(data);
      return NextResponse.json({ message }, { status });
    }
    if (isBurnTx) {
      console.log("burn tx");
      const { message, status } = await processBurnTx(data);
      return NextResponse.json({ message }, { status });
    }
    if (isLaunchTx) {
      console.log("launch tx");
      const { message, status } = await processLaunchTx(data);
      return NextResponse.json({ message }, { status });
    }
    if (isClaimCuratorRewardsTx) {
      console.log("claim curator rewards tx");
      const { message, status } = await processClaimCuratorRewardsTx(data);
      return NextResponse.json({ message }, { status });
      
    }
  } catch (error) {
    console.log("error", error);
    return NextResponse.json({ message: "Error processing webhook" }, { status: 500 });
  }
}