import idl from "@/lib/on-chain/idl.json";
import * as anchor from "@coral-xyz/anchor";
import { type BangerProgram } from "@/types/program";
import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { CLUSTER_URL } from "./constants";

async function initCurve() {
  try {
    const connection = new Connection(CLUSTER_URL, {
      commitment: "processed",
    });
    const secret = process.env.SOLANA_PRIVATE_KEY;
    if (!secret) {
      throw new Error("Missing SOLANA_PRIVATE_KEY");
    }
    const nums = secret.split(",");
    const secretArray = nums.map((val) => parseInt(val));
    const secretKey = Uint8Array.from(secretArray);
    const feePayer = Keypair.fromSecretKey(secretKey);
    const wallet = new Wallet(feePayer);
    const provider = new AnchorProvider(connection, wallet, {});
    const program = new Program<BangerProgram>(idl as BangerProgram, provider);

    try {
      const curve = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("curve")],
        program.programId
      )[0];

      console.log("curve account: ", curve.toString());

      const signature = await program.methods
        .initCurve()
        .accounts({
          curve,
        })
        .rpc();

      console.log("signature", signature);

    } catch (e) {
      console.error(e);
    }
  } catch (error) {
    console.error("Error in initPool function:", error);
    throw error;
  }
}

initCurve();