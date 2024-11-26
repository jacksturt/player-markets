"use server";
import { Transaction, Keypair } from "@solana/web3.js";

async function getAdminSecret(): Promise<string | null> {
  const secret = process.env.SOLANA_PRIVATE_KEY;
  return secret ?? null;
};

async function adminSignTx(
  clientSerializedTx: string
) {
  const secret = await getAdminSecret();
  if (!secret) {
    throw new Error("Missing SOLANA_PRIVATE_KEY");
  }
  const tx = Transaction.from(Buffer.from(clientSerializedTx, "base64"));
  
  const secretKey = Uint8Array.from(secret.split(",").map(Number));
  const admin = Keypair.fromSecretKey(secretKey);
  tx.partialSign(admin);
  
  const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");
  return serializedTx;
};

export { adminSignTx };