import {
  Connection,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";

const fromKeypair = Keypair.generate();
const toKeypair = Keypair.generate();
const url = "https://engine.mirror.ad/rpc/1f6ac870-ede7-4a31-88d2-352cbe9fbba2";
const connection = new Connection(url, "confirmed");

(async () => {
  const airdropSignature = await connection.requestAirdrop(
    new PublicKey("BxYNqLJhzzmDgrjdLkzH25wNsf8YrUoLfnqxD2SJ8KZP"),
    LAMPORTS_PER_SOL
  );
})();
