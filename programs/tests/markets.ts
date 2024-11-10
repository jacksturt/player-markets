import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Markets } from "../target/types/markets";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  createMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
const LAMAR_ID = "e06a9c07";
describe("markets", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Markets as Program<Markets>;
  const connection = anchor.getProvider().connection;
  const maker = Keypair.generate();
  const taker = Keypair.generate();
  console.log("maker", maker.publicKey.toBase58());
  console.log("taker", taker.publicKey.toBase58());
  let base_token_mint: PublicKey;

  let makerAta: PublicKey;
  let takerAta: PublicKey;
  const timestamp = Date.now().toString();
  console.log(timestamp.length + LAMAR_ID.length);
  const config = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from(LAMAR_ID), Buffer.from(timestamp)],
    program.programId
  )[0];
  const player_token_mint = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), Buffer.from(LAMAR_ID), Buffer.from(timestamp)],
    program.programId
  )[0];
  let vault: PublicKey;

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string, name?: string): Promise<string> => {
    console.log(
      `${name}: Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
    );
    return signature;
  };

  it("Airdrop", async () => {
    await connection
      .requestAirdrop(maker.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
    await connection
      .requestAirdrop(taker.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
  });

  it("Create mints and mint to", async () => {
    base_token_mint = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      6
    );

    makerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        maker,
        base_token_mint,
        maker.publicKey
      )
    ).address;

    takerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        taker,
        base_token_mint,
        taker.publicKey
      )
    ).address;

    console.log("takerAta", takerAta.toBase58());
    vault = getAssociatedTokenAddressSync(
      base_token_mint,
      player_token_mint,
      true
    );

    console.log(`Your mint ata is: ${makerAta.toBase58()}`);
    // Mint to ATA
    await mintTo(
      connection,
      maker,
      base_token_mint,
      makerAta,
      maker.publicKey,
      6
    )
      .then(confirm)
      .then(log);

    await mintTo(connection, taker, base_token_mint, takerAta, maker, 6)
      .then(confirm)
      .then(log);
  });

  it("Is initialized!", async () => {
    // Add your test here.
    console.log("base_token_mint", base_token_mint.toBase58());
    console.log("player_token_mint", player_token_mint.toBase58());
    console.log("config", config.toBase58());
    console.log("vault", vault.toBase58());
    console.log("maker", maker.publicKey.toBase58());
    console.log("tokenProgram", TOKEN_PROGRAM_ID.toBase58());
    console.log("systemProgram", SystemProgram.programId.toBase58());
    console.log(
      "associatedTokenProgram",
      ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()
    );

    const tx = await program.methods
      .initMint(new anchor.BN(100), LAMAR_ID, timestamp)
      .accountsPartial({
        payer: maker.publicKey,
        baseTokenMint: base_token_mint,
        vault,
        playerTokenMint: player_token_mint,
        config,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
