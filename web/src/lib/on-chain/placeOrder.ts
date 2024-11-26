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
import { NO_EXPIRATION_LAST_VALID_SLOT } from "@/manifest/src/constants";

async function placeOrder(
  connection: Connection,
  wallet: Wallet,
  marketAddress: PublicKey,
  numBaseTokens: number,
  tokenPrice: number,
  isBid: boolean,
  orderType: OrderType,
  clientOrderId: number,
  lastValidSlot: number = NO_EXPIRATION_LAST_VALID_SLOT
) {
  const provider = new AnchorProvider(connection, wallet, {});
  const client: ManifestClient = await ManifestClient.getClientForMarket(
    connection,
    marketAddress,
    wallet,
    provider
  );

  const placeOrderIx = client.placeOrderIx({
    numBaseTokens,
    tokenPrice,
    isBid,
    lastValidSlot,
    orderType,
    clientOrderId,
  });

  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    let recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const tx = new Transaction().add(placeOrderIx);
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

export { placeOrder };
