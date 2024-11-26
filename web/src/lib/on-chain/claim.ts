import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { type BangerProgram } from "@/types/program";
import BangerProgramIDL from "@/lib/on-chain/idl.json";
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  CLUSTER_URL,
  AUTHOR_VAULT_RENT_EXEMPTION,
  AUTHOR_VAULT_DATA,
  ADMIN_PK,
} from "@/lib/on-chain/constants";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  getCollectionByTwitterId,
  getAnyCollection,
  resetClaimableCuratorRewards,
  verifyWallet,
} from "@/server/user";
import { getPriorityFeeEstimate } from "./utils";
import { adminSignTx } from "@/server/admin";
import * as anchor from "@coral-xyz/anchor";

async function handleClaimAuthorRewards(
  twitterId: string,
  wallet: WalletContextState,
  anchorWallet: Wallet,
  toast: any
) {
  const { publicKey } = wallet;
  const authorId = twitterId;

  if (!publicKey || !anchorWallet) {
    toast({ title: `Please connect your wallet first!` });
    return;
  }

  const connection = new Connection(CLUSTER_URL, {
    commitment: "processed",
  });
  const provider = new AnchorProvider(connection, anchorWallet, {});
  const program = new Program(
    BangerProgramIDL as anchor.Idl,
    provider
  ) as unknown as Program<BangerProgram>;

  const authorVaultPublicKey = PublicKey.findProgramAddressSync(
    [Buffer.from(AUTHOR_VAULT_DATA), Buffer.from(authorId)],
    program.programId
  )[0];
  const balance = await connection.getBalance(authorVaultPublicKey);
  console.log("authorId", authorId);
  console.log("authorVaultPublicKey", authorVaultPublicKey.toBase58());
  console.log("Author Vault Balance:", balance);

  if (balance <= AUTHOR_VAULT_RENT_EXEMPTION) {
    toast({ title: `No rewards to claim!` });
    return;
  }

  const collectionPublicKey = await getCollectionByTwitterId(twitterId);
  if (!collectionPublicKey) {
    toast({ title: `No collection found for ${twitterId}!` });
    return;
  }
  const { blockhash } = await provider.connection.getLatestBlockhash();

  const tx = new Transaction();
  tx.feePayer = publicKey;
  tx.recentBlockhash = blockhash;

  const ix = await program.methods
    .claimAuthorRewards(authorId)
    .accountsPartial({
      author: publicKey,
      admin: ADMIN_PK,
      collection: new PublicKey(collectionPublicKey),
    })
    .instruction();

  const feeEstimate = await getPriorityFeeEstimate("High", tx);
  const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: feeEstimate.priorityFeeEstimate,
  });
  tx.add(ix);
  tx.add(computePriceIx);

  const serializedTx = tx
    .serialize({ requireAllSignatures: false })
    .toString("base64");


  const adminSignedSerializedTx = await adminSignTx(serializedTx);
  const adminSignedTx = Transaction.from(
    Buffer.from(adminSignedSerializedTx, "base64")
  );

  toast({
    title: "Approve transaction",
    description: "Please review and approve the transaction in your wallet",
  });

  const signedTx = await anchorWallet.signTransaction(adminSignedTx);

  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
  });

  if (!signature) {
    toast({ title: `Failed to claim rewards!` });
    return;
  }

  console.log(signature);
  return signature;
}

async function handleClaimCuratorRewards(
  twitterId: string,
  amount: number,
  wallet: WalletContextState,
  anchorWallet: Wallet,
  toast: any
) {
  const { publicKey } = wallet;
  console.log("claiming amount", amount);

  if (!publicKey || !anchorWallet) {
    toast({ title: `Please connect your wallet first!` });
    return;
  }

  await verifyWallet(twitterId, publicKey.toBase58());

  const connection = new Connection(CLUSTER_URL, {
    commitment: "processed",
  });

  const collectionPublicKey = await getAnyCollection();
  if (!collectionPublicKey) {
    toast({ title: `No collection found!` });
    return;
  }

  const provider = new AnchorProvider(connection, anchorWallet, {});
  const program = new Program(
    BangerProgramIDL as anchor.Idl,
    provider
  ) as unknown as Program<BangerProgram>;

  const { blockhash } = await provider.connection.getLatestBlockhash();

  const tx = new Transaction();
  tx.feePayer = publicKey;
  tx.recentBlockhash = blockhash;

  const ix = await program.methods
    .claimCuratorRewards(new BN(amount))
    .accountsPartial({
      curator: new PublicKey(publicKey),
      admin: ADMIN_PK,
      collection: new PublicKey(collectionPublicKey),
    })
    .instruction();
  tx.add(ix);

  const feeEstimate = await getPriorityFeeEstimate("High", tx);
  const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: feeEstimate.priorityFeeEstimate
  });
  tx.add(computePriceIx);

  const serializedTx = tx
    .serialize({ requireAllSignatures: false })
    .toString("base64");

  const adminSignedSerializedTx = await adminSignTx(serializedTx);
  const adminSignedTx = Transaction.from(Buffer.from(adminSignedSerializedTx, "base64"));

  toast({
    title: "Approve transaction",
    description: "Please review and approve the transaction in your wallet",
  });

  const signedTx = await anchorWallet.signTransaction(adminSignedTx);

  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
  });

  if (!signature) {
    toast({ title: `Failed to claim rewards!` });
    return;
  }

  await resetClaimableCuratorRewards(twitterId, signature);

  console.log(signature);
  return signature;
}

export { handleClaimAuthorRewards, handleClaimCuratorRewards };