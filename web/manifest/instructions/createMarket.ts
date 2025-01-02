import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";
import { FIXED_MANIFEST_HEADER_SIZE } from "manifest/src/constants";
import { getClusterFromConnection } from "manifest/src/utils";
import { PROGRAM_ID } from "manifest/src/manifest";
import { ManifestClient } from "manifest/src";
import { AnchorProvider } from "@coral-xyz/anchor";

export async function createMarketTX(
  connection: Connection,
  provider: AnchorProvider,
  quoteMint: PublicKey,
  baseMint: PublicKey
): Promise<PublicKey> {
  const marketKeypair: Keypair = Keypair.generate();
  console.log("marketKeypair", marketKeypair.publicKey.toBase58());
  console.log(`Cluster is ${await getClusterFromConnection(connection)}`);

  // Get SOL for rent and make airdrop states.

  console.log(`Created baseMint ${baseMint} quoteMint ${quoteMint}`);

  const createAccountIx: TransactionInstruction = SystemProgram.createAccount({
    fromPubkey: provider.publicKey,
    newAccountPubkey: marketKeypair.publicKey,
    space: FIXED_MANIFEST_HEADER_SIZE,
    lamports: await connection.getMinimumBalanceForRentExemption(
      FIXED_MANIFEST_HEADER_SIZE
    ),
    programId: PROGRAM_ID,
  });

  const createMarketIx = ManifestClient["createMarketIx"](
    provider.publicKey,
    baseMint,
    quoteMint,
    marketKeypair.publicKey
  );

  const recentBlockhash = await connection.getLatestBlockhash();

  const tx: Transaction = new Transaction({
    feePayer: provider.publicKey,
    blockhash: recentBlockhash.blockhash,
    lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
  });
  tx.add(createAccountIx);
  tx.add(createMarketIx);
  const signature = await provider.sendAndConfirm(tx, [marketKeypair]);
  console.log(`Created market at ${marketKeypair.publicKey} in ${signature}`);
  return marketKeypair.publicKey;
}
