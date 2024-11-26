"use client";
import {
  type Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  AccountMeta,
  Keypair,
  ComputeBudgetProgram,
  VersionedTransaction,
  SystemProgram,
} from "@solana/web3.js";
import BangerProgramIDL from "@/lib/on-chain/idl.json";
import * as anchor from "@coral-xyz/anchor";
import { type BangerProgram } from "@/types/program";
import { AnchorProvider, Program, type Wallet } from "@coral-xyz/anchor";
import {
  getPriorityFeeEstimate,
  getPriorityFeeMapping,
  awaitTransactionSignatureConfirmation,
} from "./utils";
import { storeUserWallet } from "./wallet";
import { TREASURY_PK } from "./constants";
import { ManifestClient } from "@/manifest/src/client";
import { OrderType } from "@/manifest/src/manifest/types";
import {
  FIXED_MANIFEST_HEADER_SIZE,
  NO_EXPIRATION_LAST_VALID_SLOT,
} from "@/manifest/src/constants";
import { PROGRAM_ID } from "@/manifest/src/manifest";

async function createMarket(
  connection: Connection,
  wallet: Wallet,
  baseMint: PublicKey,
  quoteMint: PublicKey
) {
  const marketKeypair: Keypair = Keypair.generate();

  const provider = new AnchorProvider(connection, wallet, {});
  const createAccountIx: TransactionInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: marketKeypair.publicKey,
    space: FIXED_MANIFEST_HEADER_SIZE,
    lamports: await connection.getMinimumBalanceForRentExemption(
      FIXED_MANIFEST_HEADER_SIZE
    ),
    programId: PROGRAM_ID,
  });

  const createMarketIx = ManifestClient["createMarketIx"](
    wallet.publicKey,
    baseMint,
    quoteMint,
    marketKeypair.publicKey
  );

  const tx: Transaction = new Transaction();
  tx.add(createAccountIx);
  tx.add(createMarketIx);

  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    let recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    tx.recentBlockhash = recentBlockhash;
    tx.feePayer = wallet.publicKey;

    let signature: string;
    try {
      signature = await provider.sendAndConfirm(tx, undefined, {
        skipPreflight: false,
      });
    } catch (e: any) {
      if (e.error.code == 4001) {
        return { signature: null, assets: [], type: "user rejected" };
      }
      return { signature: null, assets: [], type: "error" };
    }

    const result: any = await awaitTransactionSignatureConfirmation(
      signature,
      10000,
      connection,
      "finalized"
    );
    console.log("result", result);
    if ("timeout" in result) {
      return { signature: null, assets: [], type: "timeout" };
    }
    if (result.err) {
      return { signature: null, assets: [], type: "failed" };
    }

    return { signature, type: "success" };
  } catch (e) {
    console.error(e);
    return { signature: null, assets: [], type: "error" };
  }
}

export { createMarket };
