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
import { getPriorityFeeEstimate, getPriorityFeeMapping, awaitTransactionSignatureConfirmation } from "./utils";
import { storeUserWallet } from "./wallet";
import { TREASURY_PK } from "./constants";


async function buyBanger(
  connection: Connection,
  wallet: Wallet,
  max_lamports_in: number,
  num_mint: number,
  collectionKey: PublicKey,
  lookupTableAddress: PublicKey,
  metadataURL: string,
  tweetId: string,
  priority: "Fast" | "Turbo" | "Ultra" = "Turbo"
) {
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program(
    BangerProgramIDL as anchor.Idl,
    provider
  ) as unknown as Program<BangerProgram>;

  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    await storeUserWallet(wallet.publicKey.toBase58());

    const [buyIx, assetKeypairs] = await buyTokensInstruction(
      "X-" + tweetId,
      metadataURL,
      max_lamports_in,
      num_mint,
      wallet.publicKey,
      collectionKey,
      program
    );

    const lookupTableAccount = (
      await connection.getAddressLookupTable(lookupTableAddress)
    ).value;

    if (!lookupTableAccount) {
      throw new Error("Lookup table account not found");
    }

    let instructions = [buyIx];
    let recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const messageV0 = new anchor.web3.TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: recentBlockhash,
      instructions: instructions
    }).compileToV0Message([lookupTableAccount]);

    let versionedTx = new anchor.web3.VersionedTransaction(messageV0);
    versionedTx.sign(assetKeypairs);
    
    const testInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ...instructions,
    ];
    
    const testTransaction = new anchor.web3.VersionedTransaction(
      new anchor.web3.TransactionMessage({
        instructions: testInstructions,
        payerKey: wallet.publicKey,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      }).compileToV0Message([lookupTableAccount])
    );
    
    const rpcResponse = await connection.simulateTransaction(testTransaction, {
      replaceRecentBlockhash: true,
      sigVerify: false,
    });
    
    const unitsConsumed = rpcResponse.value.unitsConsumed;

    let customersCu = Math.ceil(unitsConsumed! * 1.1);

    const computeUnitIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: customersCu
    });
    instructions.push(computeUnitIx);

    const priorityFeeMapping = getPriorityFeeMapping(priority);
    const feeEstimate = await getPriorityFeeEstimate(priorityFeeMapping, versionedTx);

    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: feeEstimate.priorityFeeEstimate,
    });
    instructions.push(computeBudgetIx);

    recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const buyMessageV0 = new anchor.web3.TransactionMessage({
      instructions: instructions,
      payerKey: wallet.publicKey,
      recentBlockhash: recentBlockhash,
    }).compileToV0Message([lookupTableAccount]);

    const buyTx = new anchor.web3.VersionedTransaction(buyMessageV0);
    let signature: string;
    try {
      signature = await provider.sendAndConfirm(buyTx, assetKeypairs, {
        skipPreflight: false
      });
    } catch (e: any) {
      if (e.error.code == 4001) {
        return { signature: null, assets: [], type: "user rejected" };
      }
      return { signature: null, assets: [], type: "error" };
    }

    const result: any = await awaitTransactionSignatureConfirmation(signature, 10000, connection, "finalized");
    console.log("result", result);
    if ('timeout' in result) {
      return { signature: null, assets: [], type: "timeout" };
    }
    if (result.err) {
      return { signature: null, assets: [], type: "failed" };
    }
    const assets = assetKeypairs.map(({ publicKey }) => publicKey.toBase58());

    return { signature, assets, type: "success" };

  } catch (e) {
    console.error(e);
    return { signature: null, assets: [], type: "error" };
  }
}

async function sellBanger(
  connection: Connection,
  wallet: Wallet,
  min_lamports_out: number,
  num_burn: number,
  collectionKey: PublicKey,
  assets: Array<PublicKey>,
  priority: "Fast" | "Turbo" | "Ultra" = "Turbo"
) {
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program(
    BangerProgramIDL as anchor.Idl,
    provider
  ) as unknown as Program<BangerProgram>;

  try {
    let passets: AccountMeta[] = [];
    for (let i = 0; i < num_burn; i++) {
      passets[i] = {
        pubkey: assets[i],
        isSigner: false,
        isWritable: true,
      };
      console.log("burning ", assets[i].toString());
    }

    const burnIx = await program.methods
      .burn(new anchor.BN(num_burn), new anchor.BN(min_lamports_out))
      .accounts({
        seller: wallet.publicKey,
        collection: collectionKey,
        treasury: TREASURY_PK,
      })
      .remainingAccounts(passets)
      .instruction();
    
    let instructions = [burnIx];
    let recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const messageV0 = new anchor.web3.TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: recentBlockhash,
      instructions: instructions
    }).compileToV0Message();

    let versionedTx = new anchor.web3.VersionedTransaction(messageV0);

    const testInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ...instructions,
    ];
    
    const testTransaction = new anchor.web3.VersionedTransaction(
      new anchor.web3.TransactionMessage({
        instructions: testInstructions,
        payerKey: wallet.publicKey,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      }).compileToV0Message()
    );
    
    const rpcResponse = await connection.simulateTransaction(testTransaction, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });
    
    const unitsConsumed = rpcResponse.value.unitsConsumed;

    let customersCu = Math.ceil(unitsConsumed! * 1.1);

    const computeUnitIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: customersCu
    });
    instructions.push(computeUnitIx);

    const priorityFeeMapping = getPriorityFeeMapping(priority);
    const feeEstimate = await getPriorityFeeEstimate(priorityFeeMapping, versionedTx);

    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: feeEstimate.priorityFeeEstimate,
    });
    instructions.push(computeBudgetIx);

    recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const sellMessageV0 = new anchor.web3.TransactionMessage({
      instructions: instructions,
      payerKey: wallet.publicKey,
      recentBlockhash: recentBlockhash,
    }).compileToV0Message();

    const sellTx = new anchor.web3.VersionedTransaction(sellMessageV0);
    let signature: string;
    try {
      signature = await provider.sendAndConfirm(sellTx, [], {
        skipPreflight: false
      });
    } catch (e: any) {
      if (e.error.code == 4001) {
        return { signature: null, type: "user rejected" };
      }
      return { signature: null, type: "error" };
    }

    const result: any = await awaitTransactionSignatureConfirmation(signature, 10000, connection, "finalized");
    console.log("result", result);
    if ('timeout' in result) {
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

type TokenInfo = {
  assets: AccountMeta[];
  keypairs: Keypair[];
};

export const buyTokensInstruction = async (
  name: string,
  uri: string,
  max_lamports: number,
  num_to_mint: number,
  buyer: PublicKey,
  collection: PublicKey,
  program: Program<BangerProgram>
): Promise<[TransactionInstruction, Keypair[]]> => {
  let passets: AccountMeta[] = [];
  let pkeypair: Keypair[] = [];

  for (let i = 0; i < num_to_mint; i++) {
    let asset = await Keypair.generate();

    passets[i] = {
      pubkey: asset.publicKey,
      isSigner: true,
      isWritable: true,
    };
    pkeypair[i] = asset;
  }

  let tokens: TokenInfo = {
    assets: passets,
    keypairs: pkeypair,
  };

  return [
    await program.methods
      .mint(name, uri, new anchor.BN(max_lamports), new anchor.BN(num_to_mint))
      .accounts({
        buyer,
        collection,
        treasury: TREASURY_PK,
      })
      .remainingAccounts(tokens.assets)
      .signers(tokens.keypairs)
      .instruction(),

    tokens.keypairs,
  ];
};

export { buyBanger, sellBanger };