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
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { randomBytes } from "crypto";

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
  let base_token_mint = PublicKey.findProgramAddressSync(
    [Buffer.from("base")],
    program.programId
  )[0];

  let makerAtaBase: PublicKey;
  let makerAtaPlayer: PublicKey;
  let takerAtaBase: PublicKey;
  let takerAtaPlayer: PublicKey;
  const timestamp = Date.now().toString();
  console.log(timestamp.length + LAMAR_ID.length);
  const mintConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from(LAMAR_ID), Buffer.from(timestamp)],
    program.programId
  )[0];
  const player_token_mint = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), Buffer.from(LAMAR_ID), Buffer.from(timestamp)],
    program.programId
  )[0];
  let vault: PublicKey;
  const auth = PublicKey.findProgramAddressSync(
    [Buffer.from("auth")],
    program.programId
  )[0];

  const seed = new BN(randomBytes(8));
  const baseConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("baseConfig")],
    program.programId
  )[0];
  const marketConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), seed.toBuffer().reverse()],
    program.programId
  )[0];
  let mint_lp = PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), marketConfig.toBuffer()],
    program.programId
  )[0];
  let vault_x_ata: PublicKey;
  let vault_y_ata: PublicKey;

  let makerAtaLp: PublicKey;

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

  it("Can Init Base!", async () => {
    const tx = await program.methods
      .initBase()
      .accountsStrict({
        payer: maker.publicKey,
        baseTokenMint: base_token_mint,
        config: baseConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Create mints and mint to", async () => {
    makerAtaBase = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        maker,
        base_token_mint,
        maker.publicKey
      )
    ).address;

    takerAtaBase = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        taker,
        base_token_mint,
        taker.publicKey
      )
    ).address;

    makerAtaLp = await getAssociatedTokenAddress(
      mint_lp,
      maker.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    console.log("takerAta", takerAtaBase.toBase58());
    vault = getAssociatedTokenAddressSync(base_token_mint, mintConfig, true);

    console.log(`Your mint ata is: ${makerAtaBase.toBase58()}`);
    // Mint to ATA

    vault_x_ata = await getAssociatedTokenAddress(
      base_token_mint,
      auth,
      true,
      TOKEN_PROGRAM_ID
    );
    vault_y_ata = await getAssociatedTokenAddress(
      player_token_mint,
      auth,
      true,
      TOKEN_PROGRAM_ID
    );
  });

  it("Can Faucet Base!", async () => {
    const context = {
      payer: maker.publicKey,
      baseTokenMint: base_token_mint,
      config: baseConfig,
      destination: makerAtaBase,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    Object.entries(context).forEach(([key, value]) => {
      console.log(key, value.toBase58());
    });

    const tx = await program.methods
      .faucetBase(new anchor.BN(1000000000))
      .accountsStrict(context)
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const base = await getAccount(connection, makerAtaBase);
        console.log("maker base amount after", base.amount);
      });

    const tx2 = await program.methods
      .faucetBase(new anchor.BN(1000000000))
      .accountsStrict({
        payer: taker.publicKey,
        baseTokenMint: base_token_mint,
        config: baseConfig,
        destination: takerAtaBase,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const base = await getAccount(connection, takerAtaBase);
        console.log("taker base amount after", base.amount);
      });
  });

  it("Can Init Mint!", async () => {
    // Add your test here.

    const tx = await program.methods
      .initMint(new anchor.BN(100), LAMAR_ID, timestamp)
      .accountsPartial({
        payer: maker.publicKey,
        baseTokenMint: base_token_mint,
        vault,
        playerTokenMint: player_token_mint,
        config: mintConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Can Mint!", async () => {
    // Add your test here.
    makerAtaPlayer = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        maker,
        player_token_mint,
        maker.publicKey
      )
    ).address;

    takerAtaPlayer = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        taker,
        player_token_mint,
        taker.publicKey
      )
    ).address;
    const tx = await program.methods
      .mintTokens(new anchor.BN(3000))
      .accountsPartial({
        payer: maker.publicKey,
        baseTokenMint: base_token_mint,
        vault,
        playerTokenMint: player_token_mint,
        destination: makerAtaPlayer,
        config: mintConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const makerBase = await getAccount(connection, makerAtaBase);
        console.log("maker base amount after", makerBase.amount);

        const makerPlayer = await getAccount(connection, makerAtaPlayer);
        console.log("maker player amount after", makerPlayer.amount);
      });
  });

  it("Initialize Market!", async () => {
    const context = {
      auth: auth,
      initializer: maker.publicKey,
      mintX: base_token_mint,
      mintY: player_token_mint,
      mintLp: mint_lp,
      vaultX: vault_x_ata,
      vaultY: vault_y_ata,
      config: marketConfig,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    const tx = await program.methods
      .initMarket(seed, 0, maker.publicKey)
      .accountsPartial(context)
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
    console.log("Your transaction signature", tx);
  });

  it("Deposit", async () => {
    const context = {
      auth,
      user: maker.publicKey,
      mintX: base_token_mint,
      mintY: player_token_mint,
      mintLp: mint_lp,
      userX: makerAtaBase,
      userY: makerAtaPlayer,
      userLp: makerAtaLp,
      vaultX: vault_x_ata,
      vaultY: vault_y_ata,
      config: marketConfig,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    const tx = await program.methods
      .deposit(
        new BN(20),
        new BN(20),
        new BN(30),
        new BN(Math.floor(new Date().getTime() / 1000) + 600)
      )
      .accountsStrict(context)
      .signers([maker])
      .rpc();
  });

  it("Swap X for Y", async () => {
    try {
      const tx = await program.methods
        .swap(
          true,
          new BN(5),
          new BN(6),
          new BN(Math.floor(new Date().getTime() / 1000) + 600)
        )
        .accountsStrict({
          auth,
          user: maker.publicKey,
          mintX: base_token_mint,
          mintY: player_token_mint,
          userX: makerAtaBase,
          userY: makerAtaPlayer,
          vaultX: vault_x_ata,
          vaultY: vault_y_ata,
          config: marketConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([maker])
        .rpc()
        .then(confirm)
        .then(log);
    } catch (e) {
      let err = e as anchor.AnchorError;
      console.error(e);
      if (err.error.errorCode.code !== "InvalidAuthority") {
        throw e;
      }
    }
  });

  it("Swap Y for X", async () => {
    try {
      const tx = await program.methods
        .swap(
          false,
          new BN(6),
          new BN(5),
          new BN(Math.floor(new Date().getTime() / 1000) + 600)
        )
        .accountsStrict({
          auth,
          user: maker.publicKey,
          mintX: base_token_mint,
          mintY: player_token_mint,
          userX: makerAtaBase,
          userY: makerAtaPlayer,
          vaultX: vault_x_ata,
          vaultY: vault_y_ata,
          config: marketConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([maker])
        .rpc()
        .then(confirm)
        .then(log);
      console.log("Your transaction signature", tx);
    } catch (e) {
      let err = e as anchor.AnchorError;
      console.error(e);
      if (err.error.errorCode.code !== "InvalidAuthority") {
        throw e;
      }
    }
  });

  it("Withdraw", async () => {
    const tx = await program.methods
      .withdraw(
        new BN(20),
        new BN(20),
        new BN(30),
        new BN(Math.floor(new Date().getTime() / 1000) + 600)
      )
      .accountsStrict({
        auth,
        user: maker.publicKey,
        mintX: base_token_mint,
        mintY: player_token_mint,
        mintLp: mint_lp,
        userX: makerAtaBase,
        userY: makerAtaPlayer,
        userLp: makerAtaLp,
        vaultX: vault_x_ata,
        vaultY: vault_y_ata,
        config: marketConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });
});
