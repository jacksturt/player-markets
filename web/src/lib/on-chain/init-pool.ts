import { Connection, PublicKey, Keypair, ComputeBudgetProgram } from "@solana/web3.js";
import { type BangerProgram } from "@/types/program";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import idl from "@/lib/on-chain/idl.json";
import * as anchor from "@coral-xyz/anchor";
import {
  AUTHOR_VAULT_DATA,
  BANGER_FEE_PCT,
  BONDING_CURVE_PROGRAM_PK,
  CLUSTER_URL,
  CREATOR_FEE_PCT,
  CURATOR_FEE_PCT,
  POOL_DATA,
  REWARDS_POOL_DATA,
  TOKEN_CORE_METADATA_PROGRAM_ID,
  TREASURY_PK,
} from "@/lib/on-chain/constants";
import { getPriorityFeeEstimate } from "./utils";

async function initPool(authorId: string, metadataUrl: string, tweetId: string) {
  try {
    const connection = new Connection(CLUSTER_URL, {
      commitment: "processed",
    });
    const secret = process.env.SOLANA_PRIVATE_KEY;
    console.log("secret", secret);
    if (!secret) {
      throw new Error("Missing SOLANA_PRIVATE_KEY");
    }
    const nums = secret.split(",");
    const secretArray = nums.map((val) => parseInt(val));
    const secretKey = Uint8Array.from(secretArray);
    const feePayer = Keypair.fromSecretKey(secretKey);
    const wallet = new Wallet(feePayer);
    const provider = new AnchorProvider(connection, wallet, {});
    const program = new Program<BangerProgram>(
      idl as BangerProgram,
      provider
    );
    const collection = Keypair.generate();

    const authorVaultPublicKey = PublicKey.findProgramAddressSync(
      [
        Buffer.from(AUTHOR_VAULT_DATA),
        Buffer.from(authorId)
      ],
      program.programId
    )[0];

    const rewardsPoolPublicKey = PublicKey.findProgramAddressSync(
      [
        Buffer.from(REWARDS_POOL_DATA)
      ],
      program.programId
    )[0];

    console.log('rewardsPoolPublicKey', rewardsPoolPublicKey.toBase58());

    const poolPublicKey = PublicKey.findProgramAddressSync(
      [
        Buffer.from(POOL_DATA),
        collection.publicKey.toBuffer(),
      ],
      program.programId
    )[0];

    try {
      const ix = await program.methods
        .launchMarket(
          authorId,
          CREATOR_FEE_PCT,
          BANGER_FEE_PCT,
          CURATOR_FEE_PCT,
          "X-" + tweetId,
          100,
          metadataUrl
        )
        .accounts({
          collection: collection.publicKey,
        })
        .instruction();

      const slot = await connection.getSlot();

      const [lookupTableInst, lookupTableAddress] =
        anchor.web3.AddressLookupTableProgram.createLookupTable({
          authority: feePayer.publicKey,
          payer: feePayer.publicKey,
          recentSlot: slot - 1,
        });

      console.log("lookup table address:", lookupTableAddress.toBase58());

      const extendInstruction =
        anchor.web3.AddressLookupTableProgram.extendLookupTable({
          payer: feePayer.publicKey,
          authority: feePayer.publicKey,
          lookupTable: lookupTableAddress,
          addresses: [
            collection.publicKey,
            BONDING_CURVE_PROGRAM_PK,
            TREASURY_PK,
            authorVaultPublicKey,
            poolPublicKey,
            rewardsPoolPublicKey,
            anchor.web3.SystemProgram.programId,
            TOKEN_CORE_METADATA_PROGRAM_ID,
          ],
        });

      const baseBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash);
      const baseMessage = new anchor.web3.TransactionMessage({
        payerKey: feePayer.publicKey,
        recentBlockhash: baseBlockhash,
        instructions: [lookupTableInst, extendInstruction, ix],
      }).compileToV0Message([]);

      const baseTx = new anchor.web3.VersionedTransaction(baseMessage);
      const feeEstimate = await getPriorityFeeEstimate("High", baseTx);
      const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: feeEstimate.priorityFeeEstimate,
      });

      //const { blockhash } = await connection.getLatestBlockhash();
      const message = new anchor.web3.TransactionMessage({
        payerKey: feePayer.publicKey,
        recentBlockhash: baseBlockhash,
        instructions: [lookupTableInst, extendInstruction, ix, computePriceIx],
      }).compileToV0Message([]);

      const tx = new anchor.web3.VersionedTransaction(message);
      tx.sign([feePayer, collection]);
      console.log('feePayer', feePayer.publicKey.toBase58());

      const signature = await provider.sendAndConfirm(tx, [feePayer, collection], {
        skipPreflight: false,
      });

      console.log("signature", signature);

      return {
        signature,
        authorVaultPublicKey,
        collectionPublicKey: collection.publicKey,
        lookupTableAddress
      };
    } catch (e) {
      if (e instanceof anchor.web3.SendTransactionError) {
        console.error("Transaction logs:", e.getLogs(connection));
        console.error('logs', e.logs);
        console.error('message', e.message);
      } else {
        console.error("Error in initPool function:", e);
        console.error((e as any).logs);
      }
    }
  } catch (error) {
    console.error("Error in initPool function:", error);
    throw error;
  }
}

export { initPool };