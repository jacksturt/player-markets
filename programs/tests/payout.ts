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
  getMint,
  createTransferInstruction,
  transfer,
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
const MINT_COLLATERAL_RATE = 2.5;
describe("payout", () => {
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
      .updateProjectionOracle(projection1, true, true, false)
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

    const mintRecordMaker = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mint_record"),
        mintConfig.toBuffer(),
        maker.publicKey.toBuffer(),
      ],
      program.programId
    )[0];

    const tx = await program.methods
      .mintTokens(new anchor.BN(300 * 10 ** 6))
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
            BigInt(
              projection1 * Number(makerPlayer.amount) * MINT_COLLATERAL_RATE
            ) ===
            BigInt(100000000000)
        );

        const mintRecordProviderAccount =
          await program.account.mintRecord.fetch(mintRecordMaker);
        console.log(
          "mintRecordProviderAccount",
          mintRecordProviderAccount.depositedAmount.toString()
        );
        const expectedDeposit = new anchor.BN(
          projection1 * Number(makerPlayer.amount) * MINT_COLLATERAL_RATE
        );
        console.log("expectedDeposit", expectedDeposit.toString());
        assert(
          expectedDeposit.toString() ===
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
      .updateProjectionOracle(projection2, true, true, false)
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
            BigInt(
              projection2 * Number(takerPlayer.amount) * MINT_COLLATERAL_RATE
            ) ===
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

  it("Can Disable Minting!", async () => {
    let playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    console.log("playerStatsAccount", playerStatsAccount);
    const tx = await program.methods
      .updateProjectionOracle(actual, false, false, true)
      .accountsStrict({
        authority: provider.publicKey,
        playerStats,
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

  xit("Payout fails before payout is enabled.", async () => {
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

  xit("Can enable payout!", async () => {
    let playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    console.log("playerStatsAccount", playerStatsAccount);
    const tx = await program.methods
      .updateProjectionOracle(actual, false, false, true)
      .accountsStrict({
        authority: provider.publicKey,
        playerStats,
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
        console.log(
          "totalDepositedAmount",
          mintConfigAccount.totalDepositedAmount.toString()
        );

        assert(mintConfigAccount.payoutEnabled === true);
        const projectionOracleAccount = await program.account.playerStats.fetch(
          playerStats
        );
        console.log("projectionOracleAccount", projectionOracleAccount);
        assert(projectionOracleAccount.projectedPoints === projection2);
        assert(projectionOracleAccount.actualPoints === actual);
      });
  });

  it("Transfer from taker to third party", async () => {
    thirdPartyAtaPlayer = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        thirdParty,
        player_token_mint,
        thirdParty.publicKey
      )
    ).address;

    const amountToTransfer = 300 * 10 ** 6;
    console.log("amount to transfer", amountToTransfer);
    const takerAtaPlayerAccount = await getAccount(connection, takerAtaPlayer);
    console.log("taker ata player", takerAtaPlayerAccount.amount);
    console.log("taker", taker.publicKey.toBase58());
    const thirdPartyAtaPlayerAccount = await getAccount(
      connection,
      thirdPartyAtaPlayer
    );
    console.log("third party ata player", thirdPartyAtaPlayerAccount.amount);
    const signature = await transfer(
      connection,
      taker,
      takerAtaPlayer,
      thirdPartyAtaPlayer,
      taker.publicKey,
      amountToTransfer
    );

    console.log("signature", signature);

    const thirdPartyPlayerAfter = await getAccount(
      connection,
      thirdPartyAtaPlayer
    );
    console.log("third party player after", thirdPartyPlayerAfter.amount);
    assert(Number(thirdPartyPlayerAfter.amount) === amountToTransfer);

    const takerPlayerAfter = await getAccount(connection, takerAtaPlayer);
    console.log("taker player after", takerPlayerAfter.amount);
    assert(Number(takerPlayerAfter.amount) === 0);
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

    const vaultAccount = await getAccount(connection, vault);
    const vaultAmountBefore = vaultAccount.amount;

    const playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    const playerStatsActual = playerStatsAccount.actualPoints;

    const playerMintAccount = await getMint(connection, player_token_mint);
    const playerMintBefore = playerMintAccount.supply;

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
      .testMintRewardsOnly()
      .accountsStrict(context)
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const makerQuoteAfterMinterRewards = await getAccount(
          connection,
          makerAtaQuote
        );
        console.log(
          "maker quote amount after",
          makerQuoteAfterMinterRewards.amount
        );
        const makerPaidOutAfterMinterRewards =
          makerQuoteAfterMinterRewards.amount - makerQuoteBefore.amount;
        console.log(
          "maker paid out after minter rewards",
          makerPaidOutAfterMinterRewards
        );

        const firstMintAmount =
          MINT_COLLATERAL_RATE * projection1 * 300 * 10 ** 6;
        console.log("first mint amount", firstMintAmount);
        const secondMintAmount =
          MINT_COLLATERAL_RATE * projection2 * 300 * 10 ** 6;
        console.log("second mint amount", secondMintAmount);
        const totalMintAmountMaker = firstMintAmount + secondMintAmount;
        console.log("total mint amount maker", totalMintAmountMaker);
        const totalMinted = totalMintAmountMaker + secondMintAmount;
        console.log("total minted", totalMinted);
        const expectedPercentDueMaker = totalMintAmountMaker / totalMinted;
        console.log("expected percent due maker", expectedPercentDueMaker);
        const expectedPaidOutPlayerTokens = 900 * actual * 10 ** 6;
        console.log(
          "expected paid out player tokens",
          expectedPaidOutPlayerTokens
        );
        const expectedVaultRemaining =
          totalMinted - expectedPaidOutPlayerTokens;
        console.log("expected vault remaining", expectedVaultRemaining);
        const expectedPayoutMakerMintRewards =
          expectedVaultRemaining * expectedPercentDueMaker;
        console.log(
          "expected payout maker mint rewards",
          expectedPayoutMakerMintRewards
        );
        assert(
          makerPaidOutAfterMinterRewards.toString() ===
            expectedPayoutMakerMintRewards.toFixed(0)
        );

        const vaultAccountAfterMinterRewards = await getAccount(
          connection,
          vault
        );
        const vaultAmountAfterMinterRewards =
          vaultAccountAfterMinterRewards.amount;
        await program.methods
          .testPayoutPlayerTokens()
          .accountsStrict(context)
          .signers([maker])
          .rpc()
          .then(confirm)
          .then(log)
          .then(async () => {
            const makerQuoteAfterPlayerBurn = await getAccount(
              connection,
              makerAtaQuote
            );
            console.log(
              "maker quote amount after",
              makerQuoteAfterPlayerBurn.amount
            );
            const makerPaidOutAfterBurn =
              makerQuoteAfterPlayerBurn.amount -
              makerQuoteAfterMinterRewards.amount;
            console.log(
              "maker paid out after player burn",
              makerPaidOutAfterBurn
            );
            console.log(
              "vault amount after minting rewards",
              vaultAmountAfterMinterRewards
            );

            const expectedPayout = actual * 600 * 10 ** 6;
            console.log("expected payout", expectedPayout);
            assert(Number(makerPaidOutAfterBurn) === expectedPayout);
          });
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
    const takerPlayerBefore = await getAccount(connection, takerAtaPlayer);

    const vaultAccount = await getAccount(connection, vault);
    const vaultAmountBefore = vaultAccount.amount;

    const playerStatsAccount = await program.account.playerStats.fetch(
      playerStats
    );
    const playerStatsActual = playerStatsAccount.actualPoints;

    const playerMintAccount = await getMint(connection, player_token_mint);
    const playerMintBefore = playerMintAccount.supply;

    console.log(
      "mintRecordTakerAccount",
      mintRecordTakerAccount.depositedAmount.toString(),
      "taker player token mint amount",
      takerPlayerBefore.amount.toString()
    );

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
      .testMintRewardsOnly()
      .accountsStrict(context)
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const takerQuoteAfterMinterRewards = await getAccount(
          connection,
          takerAtaQuote
        );
        console.log(
          "taker quote amount after",
          takerQuoteAfterMinterRewards.amount
        );
        const takerPaidOutAfterMinterRewards =
          takerQuoteAfterMinterRewards.amount - takerQuoteBefore.amount;
        console.log(
          "taker paid out after minter rewards",
          takerPaidOutAfterMinterRewards
        );

        const firstMintAmount =
          MINT_COLLATERAL_RATE * projection1 * 300 * 10 ** 6;
        console.log("first mint amount", firstMintAmount);
        const secondMintAmount =
          MINT_COLLATERAL_RATE * projection2 * 300 * 10 ** 6;
        console.log("second mint amount", secondMintAmount);
        const totalMintAmountTaker = secondMintAmount;
        console.log("total mint amount maker", totalMintAmountTaker);
        const totalMinted =
          totalMintAmountTaker + secondMintAmount + firstMintAmount;
        console.log("total minted", totalMinted);
        const expectedPercentDueTaker = totalMintAmountTaker / totalMinted;
        console.log("expected percent due maker", expectedPercentDueTaker);
        const expectedPaidOutPlayerTokens = 900 * actual * 10 ** 6;
        console.log(
          "expected paid out player tokens",
          expectedPaidOutPlayerTokens
        );
        const expectedVaultRemaining =
          totalMinted - expectedPaidOutPlayerTokens;
        console.log("expected vault remaining", expectedVaultRemaining);
        const expectedPayoutTakerMintRewards =
          expectedVaultRemaining * expectedPercentDueTaker;
        console.log(
          "expected payout taker mint rewards",
          expectedPayoutTakerMintRewards
        );
        assert(
          takerPaidOutAfterMinterRewards.toString() ===
            expectedPayoutTakerMintRewards.toFixed(0)
        );

        const vaultAccountAfterMinterRewards = await getAccount(
          connection,
          vault
        );
        const vaultAmountAfterMinterRewards =
          vaultAccountAfterMinterRewards.amount;
        await program.methods
          .testPayoutPlayerTokens()
          .accountsStrict(context)
          .signers([taker])
          .rpc()
          .then(confirm)
          .then(log)
          .then(async () => {
            const takerQuoteAfterPlayerBurn = await getAccount(
              connection,
              takerAtaQuote
            );
            console.log(
              "taker quote amount after",
              takerQuoteAfterPlayerBurn.amount
            );
            const takerPaidOutAfterBurn =
              takerQuoteAfterPlayerBurn.amount -
              takerQuoteAfterMinterRewards.amount;
            console.log(
              "taker paid out after player burn",
              takerPaidOutAfterBurn
            );
            console.log(
              "vault amount after minting rewards",
              vaultAmountAfterMinterRewards
            );

            const expectedPayout = 0;
            console.log("expected payout", expectedPayout);
            assert(Number(takerPaidOutAfterBurn) === expectedPayout);
          });
      });
  });

  it("Payout third party", async () => {
    const mintConfigAccount = await program.account.playerMintConfig.fetch(
      mintConfig
    );
    console.log("mintConfigAccount", mintConfigAccount.totalDepositedAmount);
    try {
      const mintRecordThirdPartyAccount =
        await program.account.mintRecord.fetch(mintRecordThirdParty);
    } catch (e) {
      console.log(e);
      assert(e.toString().includes("Account does not exist or has no data"));
    }

    console.log("before");
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
      mintRecord: null,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    const tx = await program.methods
      .testMintRewardsOnly()
      .accountsStrict(context)
      .signers([thirdParty])
      .rpc()
      .then(confirm)
      .then(log)
      .then(async () => {
        const thirdPartyQuoteAfterMinterRewards = await getAccount(
          connection,
          thirdPartyAtaQuote
        );
        console.log(
          "third party quote amount after",
          thirdPartyQuoteAfterMinterRewards.amount
        );
        const thirdPartyPaidOutAfterMinterRewards =
          thirdPartyQuoteAfterMinterRewards.amount -
          thirdPartyQuoteBefore.amount;
        console.log(
          "third party paid out after minter rewards",
          thirdPartyPaidOutAfterMinterRewards
        );

        const expectedPayout = 0;
        console.log("expected payout", expectedPayout);
        assert(
          thirdPartyPaidOutAfterMinterRewards.toString() ===
            expectedPayout.toFixed(0)
        );

        const vaultAccountAfterMinterRewards = await getAccount(
          connection,
          vault
        );
        const vaultAmountAfterMinterRewards =
          vaultAccountAfterMinterRewards.amount;
        await program.methods
          .testPayoutPlayerTokens()
          .accountsStrict(context)
          .signers([thirdParty])
          .rpc()
          .then(confirm)
          .then(log)
          .then(async () => {
            const thirdPartyQuoteAfterPlayerBurn = await getAccount(
              connection,
              thirdPartyAtaQuote
            );
            console.log(
              "third party quote amount after",
              thirdPartyQuoteAfterPlayerBurn.amount
            );
            const thirdPartyPaidOutAfterBurn =
              thirdPartyQuoteAfterPlayerBurn.amount -
              thirdPartyQuoteAfterMinterRewards.amount;
            console.log(
              "third party paid out after player burn",
              thirdPartyPaidOutAfterBurn
            );
            console.log(
              "vault amount after minting rewards",
              vaultAmountAfterMinterRewards
            );

            const expectedPayout = 300 * 10 ** 6 * actual;
            console.log("expected payout", expectedPayout);
            assert(Number(thirdPartyPaidOutAfterBurn) === expectedPayout);
          });
      });
  });

  xit("Close Accounts", async () => {
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
