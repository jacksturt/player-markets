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
import MintIDL from "@/lib/on-chain/mintIdl.json";
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
import { MintProgram } from "@/types/mint-program";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

async function createMint(connection: Connection, wallet: Wallet) {
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program(
    MintIDL as anchor.Idl,
    provider
  ) as unknown as Program<MintProgram>;
  const timestamp = Date.now().toString();
  const LAMAR_ID = "e06a9c07";

  const mintConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from(LAMAR_ID), Buffer.from(timestamp)],
    program.programId
  )[0];

  let base_token_mint = PublicKey.findProgramAddressSync(
    [Buffer.from("base")],
    program.programId
  )[0];

  const player_token_mint = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), Buffer.from(LAMAR_ID), Buffer.from(timestamp)],
    program.programId
  )[0];
  try {
    const vault = getAssociatedTokenAddressSync(
      base_token_mint,
      mintConfig,
      true
    );
    const createMintIx = await program.methods
      .initMint(new anchor.BN(3), LAMAR_ID, timestamp)
      .accountsPartial({
        payer: wallet.publicKey,
        baseTokenMint: base_token_mint,
        vault,
        playerTokenMint: player_token_mint,
        config: mintConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .instruction();

    const createMintTx = new Transaction().add(createMintIx);
    let recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    createMintTx.recentBlockhash = recentBlockhash;
    createMintTx.feePayer = wallet.publicKey;

    let signature: string;
    try {
      signature = await provider.sendAndConfirm(createMintTx, [], {
        skipPreflight: false,
      });
    } catch (e: any) {
      if (e.error.code == 4001) {
        return { signature: null, type: "user rejected" };
      }
      return { signature: null, type: "error" };
    }

    const result: any = await awaitTransactionSignatureConfirmation(
      signature,
      10000,
      connection,
      "finalized"
    );
    console.log("result", result);
    if ("timeout" in result) {
      return { signature: null, type: "timeout" };
    }
    if (result.err) {
      return { signature: null, type: "failed" };
    }
    return { signature, type: "success" };
  } catch (e) {
    console.error(e);
    return { signature: null, type: "error" };
  }
}

export { createMint };
