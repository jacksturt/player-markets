import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Tradetalk } from "../target/types/tradetalk";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendTransactionError,
  SystemProgram,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { randomBytes } from "crypto";
import { createMarket } from "../manifest/tests/createMarket";
import { Market } from "@cks-systems/manifest-sdk";
import { deposit } from "../manifest/tests/deposit";
import { ManifestClient } from "@cks-systems/manifest-sdk";
import { placeOrder } from "../manifest/tests/placeOrder";
import { OrderType } from "../manifest/src/manifest";
import { assert } from "chai";

const LAMAR_ID = "19781";
describe("tradetalk", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Tradetalk as Program<Tradetalk>;
  const provider = anchor.getProvider();
  const connection = anchor.getProvider().connection;
  const maker = Keypair.generate();
  const taker = Keypair.generate();
  console.log("maker", maker.publicKey.toBase58());
  console.log("taker", taker.publicKey.toBase58());
  let quote_token_mint = PublicKey.findProgramAddressSync(
    [Buffer.from("quote")],
    program.programId
  )[0];

  let makerAtaQuote: PublicKey;
  let makerAtaPlayer: PublicKey;
  let takerAtaQuote: PublicKey;
  let takerAtaPlayer: PublicKey;
  // const timestamp = Date.now().toString();
  const timestamp = "1737012463491";
  console.log(timestamp.length + LAMAR_ID.length);
  const mintConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from(LAMAR_ID), Buffer.from(timestamp)],
    program.programId
  )[0];
  const player_token_mint = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), Buffer.from(LAMAR_ID), Buffer.from(timestamp)],
    program.programId
  )[0];
  const vault = getAssociatedTokenAddressSync(
    quote_token_mint,
    mintConfig,
    true
  );

  const auth = PublicKey.findProgramAddressSync(
    [Buffer.from("auth")],
    program.programId
  )[0];
  const mintRecordMaker = PublicKey.findProgramAddressSync(
    [
      Buffer.from("mint_record"),
      mintConfig.toBuffer(),
      maker.publicKey.toBuffer(),
    ],
    program.programId
  )[0];
  const mintRecordTaker = PublicKey.findProgramAddressSync(
    [
      Buffer.from("mint_record"),
      mintConfig.toBuffer(),
      taker.publicKey.toBuffer(),
    ],
    program.programId
  )[0];
  const playerStats = PublicKey.findProgramAddressSync(
    [
      Buffer.from("player_stats"),
      Buffer.from(LAMAR_ID),
      Buffer.from(timestamp),
    ],
    program.programId
  )[0];

  const seed = new BN(randomBytes(8));
  const quoteConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("quoteConfig")],
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
  const projection1 = 23.54;
  const projection2 = 31.65;
  const actual = 29.39;
  let vault_x_ata: PublicKey;
  let vault_y_ata: PublicKey;

  let makerAtaLp: PublicKey;
  let marketAddress: PublicKey;
  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  console.log("Account Size:", program.account.playerMintConfig.size);
  console.log("Account Size:", program.account.playerStats.size);
  console.log("Account Size:", program.account.mintRecord.size);

  const log = async (signature: string, name?: string): Promise<string> => {
    console.log(
      `${name}: Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
    );
    return signature;
  };

  xit("Airdrop", async () => {
    await connection
      .requestAirdrop(maker.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
    await connection
      .requestAirdrop(taker.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
  });

  xit("Can Init Quote!", async () => {
    const tx = await program.methods
      .initQuote()
      .accountsStrict({
        payer: provider.publicKey,
        quoteTokenMint: quote_token_mint,
        config: quoteConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      // .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  xit("Create mints and mint to", async () => {
    makerAtaQuote = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        maker,
        quote_token_mint,
        maker.publicKey
      )
    ).address;

    takerAtaQuote = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        taker,
        quote_token_mint,
        taker.publicKey
      )
    ).address;

    console.log("takerAta", takerAtaQuote.toBase58());

    console.log(`Your mint ata is: ${makerAtaQuote.toBase58()}`);
    // Mint to ATA
  });

  xit("Can Faucet Quote!", async () => {
    const providerAtaQuote = await getAssociatedTokenAddress(
      quote_token_mint,
      provider.publicKey
    );
    const context = {
      payer: provider.publicKey,
      quoteTokenMint: quote_token_mint,
      config: quoteConfig,
      destination: providerAtaQuote,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    Object.entries(context).forEach(([key, value]) => {
      console.log(key, value.toBase58());
    });

    const tx = await program.methods
      .faucetQuote(new anchor.BN(100000000000))
      .accountsStrict(context)
      // .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const quote = await getAccount(connection, providerAtaQuote);
        console.log("maker quote amount after", quote.amount);
      });

    // const tx2 = await program.methods
    //   .faucetQuote(new anchor.BN(100000000000))
    //   .accountsStrict({
    //     payer: taker.publicKey,
    //     quoteTokenMint: quote_token_mint,
    //     config: quoteConfig,
    //     destination: takerAtaQuote,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     systemProgram: SystemProgram.programId,
    //     associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    //   })
    //   .signers([taker])
    //   .rpc()
    //   .then(confirm)
    //   .then(log)
    //   .then(async () => {
    //     const quote = await getAccount(connection, takerAtaQuote);
    //     console.log("taker quote amount after", quote.amount);
    //   });
  });

  xit("Can Init Mint!", async () => {
    // Add your test here.
    const context = {
      payer: provider.publicKey,
      quoteTokenMint: quote_token_mint,
      vault,
      playerTokenMint: player_token_mint,
      config: mintConfig,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    Object.entries(context).forEach(([key, value]) => {
      console.log(key, value.toBase58());
    });

    console.log("timestamp", timestamp);
    const tx = await program.methods
      .initMint(LAMAR_ID, timestamp)
      .accountsPartial(context)
      .rpc()
      .catch(async (e: SendTransactionError) => {
        console.log("error", e);
        const logs = await e.getLogs(connection);
        console.log(logs);
      });
    console.log("Your transaction signature", tx);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  xit("Can Init Projection Oracle!", async () => {
    // Add your test here.
    const context = {
      payer: provider.publicKey,
      playerStats,
      config: mintConfig,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    Object.entries(context).forEach(([key, value]) => {
      console.log(key, value.toBase58());
    });

    console.log("timestamp", timestamp);
    const tx = await program.methods
      .initProjectionOracle(LAMAR_ID, timestamp)
      .accountsPartial(context)
      .rpc()
      .catch(async (e: SendTransactionError) => {
        console.log("error", e);
        const logs = await e.getLogs(connection);
        console.log(logs);
      });
    console.log("Your transaction signature", tx);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  xit("Can Update Projection Oracle!", async () => {
    let playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    console.log("playerStatsAccount", playerStatsAccount);
    const tx = await program.methods
      .updateProjectionOracle(projection1)
      .accountsStrict({
        authority: provider.publicKey,
        playerStats,
        config: mintConfig,
      })
      .rpc();

    playerStatsAccount = await program.account.playerStats.fetch(playerStats);
    console.log("playerStatsAccount", playerStatsAccount);
  });

  xit("Can Mint!", async () => {
    // Add your test here.
    // makerAtaPlayer = (
    //   await getOrCreateAssociatedTokenAccount(
    //     connection,
    //     maker,
    //     player_token_mint,
    //     maker.publicKey
    //   )
    // ).address;

    const providerAtaPlayer = await getAssociatedTokenAddress(
      player_token_mint,
      provider.publicKey
    );

    const mintRecordProvider = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mint_record"),
        mintConfig.toBuffer(),
        provider.publicKey.toBuffer(),
      ],
      program.programId
    )[0];

    const tx = await program.methods
      .mintTokens(new anchor.BN(300000000))
      .accountsPartial({
        payer: provider.publicKey,
        quoteTokenMint: quote_token_mint,
        vault,
        playerTokenMint: player_token_mint,
        destination: providerAtaPlayer,
        config: mintConfig,
        mintRecord: mintRecordProvider,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      // .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const providerAtaQuote = await getAssociatedTokenAddress(
          quote_token_mint,
          provider.publicKey
        );
        const providerQuote = await getAccount(connection, providerAtaQuote);
        console.log("provider quote amount after", providerQuote.amount);

        const providerPlayer = await getAccount(connection, providerAtaPlayer);
        console.log("provider player amount after", providerPlayer.amount);
        assert(
          providerQuote.amount +
            BigInt(projection1 * Number(providerPlayer.amount) * 2.5) ===
            BigInt(100000000000)
        );

        const mintRecordProviderAccount =
          await program.account.mintRecord.fetch(mintRecordProvider);
        console.log(
          "mintRecordProviderAccount",
          mintRecordProviderAccount.depositedAmount.toString()
        );
        const mintConfigAccount = await program.account.playerMintConfig.fetch(
          mintConfig
        );
        console.log(
          "mintConfigAccount",
          mintConfigAccount.totalDepositedAmount.toString()
        );
      });
  });

  xit("Can Update Projection Oracle again!", async () => {
    let playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    console.log("playerStatsAccount", playerStatsAccount);
    const tx = await program.methods
      .updateProjectionOracle(projection2)
      .accountsStrict({
        authority: provider.publicKey,
        playerStats,
        config: mintConfig,
      })
      .rpc();

    playerStatsAccount = await program.account.playerStats.fetch(playerStats);
    console.log("playerStatsAccount", playerStatsAccount);
  });

  xit("Can Mint at new projection!", async () => {
    takerAtaPlayer = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        taker,
        player_token_mint,
        taker.publicKey
      )
    ).address;
    await program.methods
      .mintTokens(new anchor.BN(300000000))
      .accountsPartial({
        payer: taker.publicKey,
        quoteTokenMint: quote_token_mint,
        vault,
        playerTokenMint: player_token_mint,
        destination: takerAtaPlayer,
        mintRecord: mintRecordTaker,
        config: mintConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const takerQuote = await getAccount(connection, takerAtaQuote);
        console.log("taker quote amount after", takerQuote.amount);

        const takerPlayer = await getAccount(connection, takerAtaPlayer);
        console.log("taker player amount after", takerPlayer.amount);
        assert(
          takerQuote.amount +
            BigInt(projection2 * Number(takerPlayer.amount) * 2.5) ===
            BigInt(100000000000)
        );
      });

    const tx = await program.methods
      .mintTokens(new anchor.BN(300000000))
      .accountsPartial({
        payer: maker.publicKey,
        quoteTokenMint: quote_token_mint,
        vault,
        playerTokenMint: player_token_mint,
        destination: makerAtaPlayer,
        config: mintConfig,
        mintRecord: mintRecordMaker,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const makerQuote = await getAccount(connection, makerAtaQuote);
        console.log("maker quote amount after", makerQuote.amount);

        const makerPlayer = await getAccount(connection, makerAtaPlayer);
        console.log("maker player amount after", makerPlayer.amount);

        const mintRecordMakerAccount = await program.account.mintRecord.fetch(
          mintRecordMaker
        );
        console.log(
          "mintRecordMakerAccount",
          mintRecordMakerAccount.depositedAmount.toString()
        );
        const mintConfigAccount = await program.account.playerMintConfig.fetch(
          mintConfig
        );
        console.log(
          "mintConfigAccount",
          mintConfigAccount.totalDepositedAmount.toString()
        );
      });
  });

  xit("Can Update Projection Oracle again again!", async () => {
    let playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    console.log("playerStatsAccount", playerStatsAccount);
    const tx = await program.methods
      .updateProjectionOracle(actual)
      .accountsStrict({
        authority: provider.publicKey,
        playerStats,
        config: mintConfig,
      })
      .rpc();

    playerStatsAccount = await program.account.playerStats.fetch(playerStats);
    console.log("playerStatsAccount", playerStatsAccount);
  });

  xit("Can Create Market!", async () => {
    marketAddress = await createMarket(
      connection,
      maker,
      quote_token_mint,
      player_token_mint
    );
    const market: Market = await Market.loadFromAddress({
      connection,
      address: marketAddress,
    });

    const makerClient = await ManifestClient.getClientForMarket(
      connection,
      marketAddress,
      maker
    );
    const takerClient = await ManifestClient.getClientForMarket(
      connection,
      marketAddress,
      taker
    );
    console.log(
      "market",
      market.quoteMint().toBase58(),
      market.quoteDecimals(),
      market.quoteMint().toBase58(),
      market.quoteDecimals()
    );
    console.log(
      "token accounts",
      makerAtaQuote.toBase58(),
      makerAtaPlayer.toBase58()
    );
    await Promise.all([
      deposit(connection, maker, marketAddress, market.quoteMint(), 99),
      deposit(connection, maker, marketAddress, market.quoteMint(), 99),
      deposit(connection, taker, marketAddress, market.quoteMint(), 99),
      deposit(connection, taker, marketAddress, market.quoteMint(), 99),
    ]);

    // setup an orderbook with 5 orders on bid and ask side
    await Promise.all([
      ...[1, 2, 3, 4, 5].map((i) =>
        placeOrder(
          connection,
          maker,
          marketAddress,
          1,
          1 - i * 0.01,
          true,
          OrderType.Limit,
          0
        )
      ),
      ...[1, 2, 3, 4, 5].map((i) =>
        placeOrder(
          connection,
          maker,
          marketAddress,
          1,
          1 + i * 0.01,
          false,
          OrderType.Limit,
          0
        )
      ),
    ]);

    await market.reload(connection);
    market.prettyPrint();
    console.log("Placing take orders");

    market.prettyPrint();

    await Promise.all([
      ...[1, 2, 3, 4, 5].map((i) =>
        placeOrder(
          connection,
          taker,
          marketAddress,
          1,
          1 - i * 0.01,
          false,
          OrderType.Limit,
          0
        )
      ),
      ...[1, 2, 3, 4, 5].map((i) =>
        placeOrder(
          connection,
          taker,
          marketAddress,
          1,
          1 + i * 0.01,
          true,
          OrderType.Limit,
          0
        )
      ),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await market.reload(connection);
    market.prettyPrint();

    const makerQuote = await getAccount(connection, makerAtaQuote);
    console.log("maker quote amount before withdraw", makerQuote.amount);

    const makerPlayer = await getAccount(connection, makerAtaPlayer);
    console.log("maker player amount before withdraw", makerPlayer.amount);

    const takerQuote = await getAccount(connection, takerAtaQuote);
    console.log("taker quote amount before withdraw", takerQuote.amount);

    const takerPlayer = await getAccount(connection, takerAtaPlayer);
    console.log("taker player amount before withdraw", takerPlayer.amount);

    await Promise.all([
      makerClient.withdrawAllIx(),
      takerClient.withdrawAllIx(),
    ]);

    console.log("maker quote amount after withdraw", makerQuote.amount);

    console.log("maker player amount after withdraw", makerPlayer.amount);

    console.log("taker quote amount after withdraw", takerQuote.amount);

    console.log("taker player amount after withdraw", takerPlayer.amount);

    // console.log("trying swap, pre swap values: ");
    // const takerQuote = await getAccount(connection, takerAtaQuote);
    // console.log("taker quote amount after", takerQuote.amount);

    // const takerPlayer = await getAccount(connection, takerAtaPlayer);
    // console.log("taker player amount after", takerPlayer.amount);
    // market.prettyPrint();

    // await swap(connection, taker, marketAddress, 1, false);

    // await market.reload(connection);
    // market.prettyPrint();

    // console.log("taker quote amount after", takerQuote.amount);

    // console.log("taker player amount after", takerPlayer.amount);

    // const fillFeed: FillFeed = new FillFeed(connection);
    // await Promise.all([
    //   fillFeed.parseLogs(true),
    //   checkForFillMessage(connection, taker, marketAddress),
    // ]);
  });

  it("Payout provider", async () => {
    const mintRecordProvider = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mint_record"),
        mintConfig.toBuffer(),
        provider.publicKey.toBuffer(),
      ],
      program.programId
    )[0];
    const providerAtaQuote = await getAssociatedTokenAddress(
      quote_token_mint,
      provider.publicKey
    );
    const providerAtaPlayer = await getAssociatedTokenAddress(
      player_token_mint,
      provider.publicKey
    );
    const mintConfigAccount = await program.account.playerMintConfig.fetch(
      mintConfig
    );
    console.log("mintConfigAccount", mintConfigAccount.totalDepositedAmount);
    const mintRecordProviderAccount = await program.account.mintRecord.fetch(
      mintRecordProvider
    );
    console.log(
      "mintRecordProviderAccount",
      mintRecordProviderAccount.depositedAmount
    );

    const providerQuoteBefore = await getAccount(connection, providerAtaQuote);
    console.log("provider quote before", providerQuoteBefore.amount);

    const context = {
      payer: provider.publicKey,
      quoteTokenMint: quote_token_mint,
      payerQuoteTokenAccount: providerAtaQuote,
      playerTokenMint: player_token_mint,
      payerPlayerTokenAccount: providerAtaPlayer,
      mintConfig,
      playerStats,
      vault,
      mintRecord: mintRecordProvider,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    Object.entries(context).forEach(([key, value]) => {
      console.log(key, value.toBase58());
    });

    const tx = await program.methods
      .payout()
      .accountsStrict(context)
      // .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const providerQuote = await getAccount(connection, providerAtaQuote);
        console.log("provider quote amount after", providerQuote.amount);
        const providerPlayer = await getAccount(connection, providerAtaPlayer);
        console.log("provider player amount after", providerPlayer.amount);
      });
  });

  xit("Payout maker", async () => {
    const mintConfigAccount = await program.account.playerMintConfig.fetch(
      mintConfig
    );
    console.log("mintConfigAccount", mintConfigAccount.totalDepositedAmount);
    const mintRecordMakerAccount = await program.account.mintRecord.fetch(
      mintRecordMaker
    );
    console.log(
      "mintRecordMakerAccount",
      mintRecordMakerAccount.depositedAmount
    );

    const makerQuoteBefore = await getAccount(connection, makerAtaQuote);
    console.log("maker quote before", makerQuoteBefore.amount);

    const context = {
      payer: maker.publicKey,
      quoteTokenMint: quote_token_mint,
      payerQuoteTokenAccount: makerAtaQuote,
      playerTokenMint: player_token_mint,
      payerPlayerTokenAccount: makerAtaPlayer,
      mintConfig,
      playerStats,
      vault,
      mintRecord: mintRecordMaker,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    Object.entries(context).forEach(([key, value]) => {
      console.log(key, value.toBase58());
    });

    const tx = await program.methods
      .payout()
      .accountsStrict(context)
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const makerQuote = await getAccount(connection, makerAtaQuote);
        console.log("maker quote amount after", makerQuote.amount);
        const makerPlayer = await getAccount(connection, makerAtaPlayer);
        console.log("maker player amount after", makerPlayer.amount);
      });
  });

  xit("Payout taker", async () => {
    const mintConfigAccount = await program.account.playerMintConfig.fetch(
      mintConfig
    );
    console.log("mintConfigAccount", mintConfigAccount.totalDepositedAmount);

    const mintRecordTakerAccount = await program.account.mintRecord.fetch(
      mintRecordTaker
    );
    console.log(
      "mintRecordTakerAccount",
      mintRecordTakerAccount.depositedAmount
    );

    const context = {
      payer: taker.publicKey,
      quoteTokenMint: quote_token_mint,
      payerQuoteTokenAccount: takerAtaQuote,
      playerTokenMint: player_token_mint,
      payerPlayerTokenAccount: takerAtaPlayer,
      mintConfig,
      playerStats,
      vault,
      mintRecord: mintRecordTaker,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    Object.entries(context).forEach(([key, value]) => {
      console.log(key, value.toBase58());
    });

    const tx = await program.methods
      .payout()
      .accountsStrict(context)
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const takerQuote = await getAccount(connection, takerAtaQuote);
        console.log("taker quote amount after", takerQuote.amount);
        const takerPlayer = await getAccount(connection, takerAtaPlayer);
        console.log("taker player amount after", takerPlayer.amount);

        const vaultAccount = await getAccount(connection, vault);
        console.log("vault", vaultAccount.amount);
      });
  });
});
