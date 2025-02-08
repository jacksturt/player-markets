import { Connection, Keypair, Transaction } from "@solana/web3.js";
import { NextResponse } from "next/server";
import bs58 from "bs58";

export async function POST(request: Request) {
  const data = await request.json();
  console.log("data", data);
  const transactionBuffer = Buffer.from(data.transaction.data);
  const transaction = Transaction.from(transactionBuffer);
  console.log("transaction", transaction);
  const feePayer = Keypair.fromSecretKey(
    bs58.decode(process.env.FEE_PAYER_SECRET_KEY!)
  );
  console.log("feePayer", feePayer);
  transaction.partialSign(feePayer);
  const serializedTransactionToSend = Buffer.from(
    transaction.serialize({
      requireAllSignatures: false,
    })
  ).toJSON();
  return NextResponse.json({
    success: true,
    serializedTransaction: serializedTransactionToSend,
  });
}
