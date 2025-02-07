import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { Tradetalk } from "../target/types/tradetalk";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SendTransactionError,
  SystemProgram,
  Transaction,
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
  const thirdParty = Keypair.generate();
  console.log("maker", maker.publicKey.toBase58());
  console.log("taker", taker.publicKey.toBase58());
  console.log("thirdParty", thirdParty.publicKey.toBase58());
  let quote_token_mint = PublicKey.findProgramAddressSync(
    [Buffer.from("quote")],
    program.programId
  )[0];

  let makerAtaQuote: PublicKey;
  let makerAtaPlayer: PublicKey;
  let thirdPartyAtaQuote: PublicKey;
  let takerAtaQuote: PublicKey;
  let takerAtaPlayer: PublicKey;
  let thirdPartyAtaPlayer: PublicKey;
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
  const mintRecordThirdParty = PublicKey.findProgramAddressSync(
    [
      Buffer.from("mint_record"),
      mintConfig.toBuffer(),
      thirdParty.publicKey.toBuffer(),
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
  const actual = 27.85;
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

  it("Airdrop", async () => {
    await connection
      .requestAirdrop(maker.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
    await connection
      .requestAirdrop(taker.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
    await connection
      .requestAirdrop(thirdParty.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
    await connection
      .requestAirdrop(provider.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
  });

  it("Can Init Quote!", async () => {
    const tx = await program.methods
      .initQuote()
      .accountsStrict({
        payer: maker.publicKey,
        quoteTokenMint: quote_token_mint,
        config: quoteConfig,
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

    thirdPartyAtaQuote = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        thirdParty,
        quote_token_mint,
        thirdParty.publicKey
      )
    ).address;

    console.log("takerAta", takerAtaQuote.toBase58());

    console.log(`Your mint ata is: ${makerAtaQuote.toBase58()}`);
    // Mint to ATA
  });

  it("Can Faucet Quote!", async () => {
    const context = {
      payer: maker.publicKey,
      quoteTokenMint: quote_token_mint,
      config: quoteConfig,
      destination: makerAtaQuote,
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
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const quote = await getAccount(connection, makerAtaQuote);
        console.log("maker quote amount after", quote.amount);
      });

    const tx2 = await program.methods
      .faucetQuote(new anchor.BN(100000000000))
      .accountsStrict({
        payer: taker.publicKey,
        quoteTokenMint: quote_token_mint,
        config: quoteConfig,
        destination: takerAtaQuote,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const quote = await getAccount(connection, takerAtaQuote);
        console.log("taker quote amount after", quote.amount);
      });

    const tx3 = await program.methods
      .faucetQuote(new anchor.BN(100000000000))
      .accountsStrict({
        payer: thirdParty.publicKey,
        quoteTokenMint: quote_token_mint,
        config: quoteConfig,
        destination: thirdPartyAtaQuote,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([thirdParty])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const quote = await getAccount(connection, thirdPartyAtaQuote);
        console.log("thirdParty quote amount after", quote.amount);
      });
  });

  it("Can Init Mint!", async () => {
    // Add your test here.
    const context = {
      payer: maker.publicKey,
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
      .signers([maker])
      .rpc()
      .catch(async (e: SendTransactionError) => {
        console.log("error", e);
        const logs = await e.getLogs(connection);
        console.log(logs);
      });
    console.log("Your transaction signature", tx);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  it("Can Init Projection Oracle!", async () => {
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
      .initProjectionOracle()
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

  it("Can Update Projection Oracle!", async () => {
    let playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    console.log("playerStatsAccount", playerStatsAccount);
    const tx = await program.methods
      .updateProjectionOracle(projection1, true)
      .accountsStrict({
        authority: provider.publicKey,
        playerStats,
        config: mintConfig,
      })
      .rpc()
      .then(confirm)
      .then(log);

    playerStatsAccount = await program.account.playerStats.fetch(playerStats);
    console.log("playerStatsAccount", playerStatsAccount);
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

    // const providerAtaPlayer = await getAssociatedTokenAddress(
    //   player_token_mint,
    //   maker.publicKey
    // );

    const mintRecordProvider = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mint_record"),
        mintConfig.toBuffer(),
        maker.publicKey.toBuffer(),
      ],
      program.programId
    )[0];

    const tx = await program.methods
      .mintTokens(new anchor.BN(300000000))
      .accountsPartial({
        payer: maker.publicKey,
        quoteTokenMint: quote_token_mint,
        vault,
        playerTokenMint: player_token_mint,
        destination: makerAtaPlayer,
        config: mintConfig,
        mintRecord: mintRecordProvider,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const makerAtaQuote = await getAssociatedTokenAddress(
          quote_token_mint,
          maker.publicKey
        );
        const makerQuote = await getAccount(connection, makerAtaQuote);
        console.log("maker quote amount after", makerQuote.amount);

        const makerPlayer = await getAccount(connection, makerAtaPlayer);
        console.log("maker player amount after", makerPlayer.amount);
        assert(
          makerQuote.amount +
            BigInt(projection1 * Number(makerPlayer.amount) * 2.5) ===
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

  it("Can Update Projection Oracle again!", async () => {
    let playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    console.log("playerStatsAccount", playerStatsAccount);
    const tx = await program.methods
      .updateProjectionOracle(projection2, true)
      .accountsStrict({
        authority: provider.publicKey,
        playerStats,
        config: mintConfig,
      })
      .rpc();

    playerStatsAccount = await program.account.playerStats.fetch(playerStats);
    console.log("playerStatsAccount", playerStatsAccount);
  });

  it("Can Mint at new projection!", async () => {
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

    thirdPartyAtaPlayer = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        thirdParty,
        player_token_mint,
        thirdParty.publicKey
      )
    ).address;
    await program.methods
      .mintTokens(new anchor.BN(300000000))
      .accountsPartial({
        payer: thirdParty.publicKey,
        quoteTokenMint: quote_token_mint,
        vault,
        playerTokenMint: player_token_mint,
        destination: thirdPartyAtaPlayer,
        mintRecord: mintRecordThirdParty,
        config: mintConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([thirdParty])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const thirdPartyQuote = await getAccount(
          connection,
          thirdPartyAtaQuote
        );
        console.log("thirdParty quote amount after", thirdPartyQuote.amount);

        const thirdPartyPlayer = await getAccount(
          connection,
          thirdPartyAtaPlayer
        );
        console.log("thirdParty player amount after", thirdPartyPlayer.amount);
        assert(
          thirdPartyQuote.amount +
            BigInt(projection2 * Number(thirdPartyPlayer.amount) * 2.5) ===
            BigInt(100000000000)
        );
      });
  });

  it("Can Disable Minting!", async () => {
    let playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    console.log("playerStatsAccount", playerStatsAccount);
    const tx = await program.methods
      .setIsMintEnabled(false)
      .accountsStrict({
        authority: provider.publicKey,
        config: mintConfig,
      })
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const mintConfigAccount = await program.account.playerMintConfig.fetch(
          mintConfig
        );
        console.log("mintConfigAccount", mintConfigAccount);
        assert(mintConfigAccount.mintingEnabled === false);
        try {
          await program.methods
            .mintTokens(new anchor.BN(300000000))
            .accountsPartial({
              payer: maker.publicKey,
              quoteTokenMint: quote_token_mint,
              vault,
              playerTokenMint: player_token_mint,
              destination: makerAtaPlayer,
              config: mintConfig,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .signers([maker])
            .rpc();
        } catch (e: any) {
          const errorLogs = await e.getLogs(connection);
          console.log("errorLogs", errorLogs);
          assert(errorLogs.toString().includes("MintingNotEnabled"));
        }
      });
  });

  it("Can Operate Market!", async () => {
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
    const thirdPartyClient = await ManifestClient.getClientForMarket(
      connection,
      marketAddress,
      thirdParty
    );
    console.log(
      "market",
      market.baseMint().toBase58(),
      market.baseDecimals(),
      market.quoteMint().toBase58(),
      market.quoteDecimals()
    );
    console.log(
      "token accounts",
      makerAtaQuote.toBase58(),
      makerAtaPlayer.toBase58()
    );
    let makerQuote = await getAccount(connection, makerAtaQuote);
    console.log("maker quote amount before deposit", makerQuote.amount);

    let makerPlayer = await getAccount(connection, makerAtaPlayer);
    console.log("maker player amount before deposit", makerPlayer.amount);

    let takerQuote = await getAccount(connection, takerAtaQuote);
    console.log("taker quote amount before deposit", takerQuote.amount);

    let takerPlayer = await getAccount(connection, takerAtaPlayer);
    console.log("taker player amount before deposit", takerPlayer.amount);
    await Promise.all([
      deposit(connection, maker, marketAddress, market.quoteMint(), 99),
      deposit(connection, maker, marketAddress, market.baseMint(), 99),
      deposit(connection, taker, marketAddress, market.quoteMint(), 99),
      deposit(connection, taker, marketAddress, market.baseMint(), 99),
      deposit(connection, thirdParty, marketAddress, market.quoteMint(), 99),
      deposit(connection, thirdParty, marketAddress, market.baseMint(), 99),
    ]);
    await market.reload(connection);
    market.prettyPrint();
    let withdrawableMakerQuote = market.getWithdrawableBalanceTokens(
      maker.publicKey,
      false
    );
    let withdrawableMakerPlayer = market.getWithdrawableBalanceTokens(
      maker.publicKey,
      true
    );
    let withdrawableTakerQuote = market.getWithdrawableBalanceTokens(
      taker.publicKey,
      false
    );
    let withdrawableTakerPlayer = market.getWithdrawableBalanceTokens(
      taker.publicKey,
      true
    );
    console.log(
      "withdrawableMakerQuote",
      withdrawableMakerQuote,
      "withdrawableMakerPlayer",
      withdrawableMakerPlayer,
      "withdrawableTakerQuote",
      withdrawableTakerQuote,
      "withdrawableTakerPlayer",
      withdrawableTakerPlayer
    );
    makerQuote = await getAccount(connection, makerAtaQuote);
    console.log("maker quote amount before withdraw", makerQuote.amount);

    makerPlayer = await getAccount(connection, makerAtaPlayer);
    console.log("maker player amount before withdraw", makerPlayer.amount);

    takerQuote = await getAccount(connection, takerAtaQuote);
    console.log("taker quote amount before withdraw", takerQuote.amount);

    takerPlayer = await getAccount(connection, takerAtaPlayer);
    console.log("taker player amount before withdraw", takerPlayer.amount);

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

    await Promise.all([
      ...[1, 2, 3, 4, 5].map((i) =>
        placeOrder(
          connection,
          thirdParty,
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
          thirdParty,
          marketAddress,
          1,
          1 + i * 0.01,
          true,
          OrderType.Limit,
          0
        )
      ),
    ]);

    await market.reload(connection);
    market.prettyPrint();

    makerQuote = await getAccount(connection, makerAtaQuote);
    console.log("maker quote amount before withdraw", makerQuote.amount);

    makerPlayer = await getAccount(connection, makerAtaPlayer);
    console.log("maker player amount before withdraw", makerPlayer.amount);

    takerQuote = await getAccount(connection, takerAtaQuote);
    console.log("taker quote amount before withdraw", takerQuote.amount);

    takerPlayer = await getAccount(connection, takerAtaPlayer);
    console.log("taker player amount before withdraw", takerPlayer.amount);

    const cancelOrderIxMaker = await makerClient.cancelAllIx();
    console.log("cancelOrderIxMaker", cancelOrderIxMaker);
    const signatureCancelOrdersIxMaker = await sendAndConfirmTransaction(
      connection,
      new Transaction().add(cancelOrderIxMaker),
      [maker]
    );

    const cancelOrderIxTaker = await takerClient.cancelAllIx();
    console.log("cancelOrderIxTaker", cancelOrderIxTaker);
    const signatureCancelOrdersIxTaker = await sendAndConfirmTransaction(
      connection,
      new Transaction().add(cancelOrderIxTaker),
      [taker]
    );

    const cancelOrderIxThirdParty = await thirdPartyClient.cancelAllIx();
    console.log("cancelOrderIxThirdParty", cancelOrderIxThirdParty);
    const signatureCancelOrdersIxThirdParty = await sendAndConfirmTransaction(
      connection,
      new Transaction().add(cancelOrderIxThirdParty),
      [thirdParty]
    );

    await market.reload(connection);
    market.prettyPrint();

    withdrawableMakerQuote = market.getWithdrawableBalanceTokens(
      maker.publicKey,
      false
    );
    withdrawableMakerPlayer = market.getWithdrawableBalanceTokens(
      maker.publicKey,
      true
    );
    withdrawableTakerQuote = market.getWithdrawableBalanceTokens(
      taker.publicKey,
      false
    );
    withdrawableTakerPlayer = market.getWithdrawableBalanceTokens(
      taker.publicKey,
      true
    );
    console.log(
      "withdrawableMakerQuote",
      withdrawableMakerQuote,
      "withdrawableMakerPlayer",
      withdrawableMakerPlayer,
      "withdrawableTakerQuote",
      withdrawableTakerQuote,
      "withdrawableTakerPlayer",
      withdrawableTakerPlayer
    );
    await makerClient.reload();
    await takerClient.reload();
    await thirdPartyClient.reload();

    const withdrawMaker = makerClient.withdrawAllIx();
    console.log("withdrawMaker", withdrawMaker);
    if (withdrawMaker.length > 0) {
      const signatureWithdrawMaker = await sendAndConfirmTransaction(
        connection,
        new Transaction().add(...withdrawMaker),
        [maker]
      );
    }
    const withdrawTaker = takerClient.withdrawAllIx();
    console.log("withdrawTaker", withdrawTaker);
    if (withdrawTaker.length > 0) {
      const signatureWithdrawTaker = await sendAndConfirmTransaction(
        connection,
        new Transaction().add(...withdrawTaker),
        [taker]
      );
    }

    const withdrawThirdParty = thirdPartyClient.withdrawAllIx();
    console.log("withdrawThirdParty", withdrawThirdParty);
    if (withdrawThirdParty.length > 0) {
      const signatureWithdrawThirdParty = await sendAndConfirmTransaction(
        connection,
        new Transaction().add(...withdrawThirdParty),
        [thirdParty]
      );
    }

    makerQuote = await getAccount(connection, makerAtaQuote);
    console.log("maker quote amount before withdraw", makerQuote.amount);

    makerPlayer = await getAccount(connection, makerAtaPlayer);
    console.log("maker player amount before withdraw", makerPlayer.amount);

    takerQuote = await getAccount(connection, takerAtaQuote);
    console.log("taker quote amount before withdraw", takerQuote.amount);

    takerPlayer = await getAccount(connection, takerAtaPlayer);
    console.log("taker player amount before withdraw", takerPlayer.amount);

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

  it("Payout fails before payout is enabled.", async () => {
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

    try {
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
    } catch (e: any) {
      const errorLogs = await e.getLogs(connection);
      console.log("errorLogs", errorLogs);
      assert(errorLogs.toString().includes("PayoutNotEnabled"));
    }
  });

  it("Can enable payout!", async () => {
    let playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    console.log("playerStatsAccount", playerStatsAccount);
    const tx = await program.methods
      .updateProjectionOracle(actual, false)
      .accountsStrict({
        authority: provider.publicKey,
        playerStats,
        config: mintConfig,
      })
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const projectionOracleAccount = await program.account.playerStats.fetch(
          playerStats
        );
        console.log("projectionOracleAccount", projectionOracleAccount);
        assert(projectionOracleAccount.projectedPoints === projection2);
        assert(projectionOracleAccount.actualPoints === actual);
        await program.methods
          .setIsPayoutEnabled(true)
          .accountsStrict({
            authority: provider.publicKey,
            config: mintConfig,
          })
          .rpc()
          .then(confirm)
          .then(log)
          .then(async () => {
            const mintConfigAccount =
              await program.account.playerMintConfig.fetch(mintConfig);
            console.log("mintConfigAccount", mintConfigAccount);
            assert(mintConfigAccount.payoutEnabled === true);
          });
      });
  });

  it("Payout maker", async () => {
    const mintConfigAccount = await program.account.playerMintConfig.fetch(
      mintConfig
    );
    console.log("mintConfigAccount", mintConfigAccount.totalDepositedAmount);
    const mintRecordMakerAccount = await program.account.mintRecord.fetch(
      mintRecordMaker
    );
    const makerPlayerBefore = await getAccount(connection, makerAtaPlayer);

    console.log(
      "mintRecordMakerAccount",
      mintRecordMakerAccount.depositedAmount.toString(),
      "maker player token mint amount",
      makerPlayerBefore.amount.toString()
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
        const makerPaidOut = makerQuote.amount - makerQuoteBefore.amount;
        console.log("maker paid out", makerPaidOut);
        try {
          const makerPlayer = await getAccount(connection, makerAtaPlayer);
          assert(false, "maker player account should not exist");
        } catch (e) {
          assert(e.toString().includes("TokenAccountNotFoundError"));
        }
        try {
          const mintRecordMakerAccount = await program.account.mintRecord.fetch(
            mintRecordMaker
          );
          assert(false, "mint record account should not exist");
        } catch (e) {
          console.log(e);
          assert(
            e
              .toString()
              .includes("Error: Account does not exist or has no data")
          );
        }
      });
  });

  it("Payout taker", async () => {
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

    const takerPlayerBefore = await getAccount(connection, takerAtaPlayer);
    console.log("taker player before", takerPlayerBefore.amount);

    const takerQuoteBefore = await getAccount(connection, takerAtaQuote);
    console.log("taker quote before", takerQuoteBefore.amount);

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
        const takerPaidOut = takerQuote.amount - takerQuoteBefore.amount;
        console.log("taker paid out", takerPaidOut);
        try {
          const takerPlayer = await getAccount(connection, takerAtaPlayer);
          assert(false, "taker player account should not exist");
        } catch (e) {
          assert(e.toString().includes("TokenAccountNotFoundError"));
        }
        try {
          const mintRecordTakerAccount = await program.account.mintRecord.fetch(
            mintRecordTaker
          );
          assert(false, "mint record account should not exist");
        } catch (e) {
          console.log(e);
          assert(
            e
              .toString()
              .includes("Error: Account does not exist or has no data")
          );
        }
      });
  });

  it("Payout third party", async () => {
    const mintConfigAccount = await program.account.playerMintConfig.fetch(
      mintConfig
    );
    console.log("mintConfigAccount", mintConfigAccount.totalDepositedAmount);

    const mintRecordThirdPartyAccount = await program.account.mintRecord.fetch(
      mintRecordThirdParty
    );
    console.log(
      "mintRecordThirdPartyAccount",
      mintRecordThirdPartyAccount.depositedAmount
    );

    const thirdPartyPlayerBefore = await getAccount(
      connection,
      thirdPartyAtaPlayer
    );
    console.log("third party player before", thirdPartyPlayerBefore.amount);
    const thirdPartyQuoteBefore = await getAccount(
      connection,
      thirdPartyAtaQuote
    );
    console.log("third party quote before", thirdPartyQuoteBefore.amount);

    const context = {
      payer: thirdParty.publicKey,
      quoteTokenMint: quote_token_mint,
      payerQuoteTokenAccount: thirdPartyAtaQuote,
      playerTokenMint: player_token_mint,
      payerPlayerTokenAccount: thirdPartyAtaPlayer,
      mintConfig,
      playerStats,
      vault,
      mintRecord: mintRecordThirdParty,
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
      .signers([thirdParty])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const thirdPartyQuote = await getAccount(
          connection,
          thirdPartyAtaQuote
        );
        console.log("thirdParty quote amount after", thirdPartyQuote.amount);
        const thirdPartyPaidOut =
          thirdPartyQuote.amount - thirdPartyQuoteBefore.amount;
        console.log("third party paid out", thirdPartyPaidOut);
        try {
          const thirdPartyPlayer = await getAccount(
            connection,
            thirdPartyAtaPlayer
          );
          assert(false, "third party player account should not exist");
        } catch (e) {
          console.log(e);
          assert(e.toString().includes("TokenAccountNotFoundError"));
        }
        try {
          const mintRecordThirdPartyAccount =
            await program.account.mintRecord.fetch(mintRecordThirdParty);
          assert(false, "mint record account should not exist");
        } catch (e) {
          assert(
            e
              .toString()
              .includes("Error: Account does not exist or has no data")
          );
        }
        const vaultAccount = await getAccount(connection, vault);
        console.log("vault", vaultAccount.amount);
        assert(vaultAccount.amount.toString() === "0");
      });
  });

  it("Close Accounts", async () => {
    const context = {
      admin: provider.publicKey,
      quoteTokenMint: quote_token_mint,
      playerStats,
      mintConfig,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    Object.entries(context).forEach(([key, value]) => {
      console.log(key, value.toBase58());
    });
    console.log("close accounts before");

    const tx = await program.methods
      .closeAccounts()
      .accountsStrict(context)
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        console.log("close accounts after1");

        try {
          const mintConfigAccount =
            await program.account.playerMintConfig.fetch(mintConfig);
          assert(false, "mint config account should not exist");
        } catch (e) {
          console.log(e);
          assert(
            e
              .toString()
              .includes("Error: Account does not exist or has no data")
          );
        }
        console.log("close accounts after2");

        try {
          const playerStatsAccount = await program.account.playerStats.fetch(
            playerStats
          );
          assert(false, "player stats account should not exist");
        } catch (e) {
          console.log(e);
          assert(
            e
              .toString()
              .includes("Error: Account does not exist or has no data")
          );
        }
        console.log("close accounts after3");
        try {
          const vaultAccount = await getAccount(connection, vault);
          assert(false, "vault account should not exist");
        } catch (e) {
          console.log(e);
          assert(e.toString().includes("TokenAccountNotFoundError"));
        }
      });
  });
});
