import { Connection, Transaction, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { ADMIN_PK, CLUSTER_URL } from "@/lib/on-chain/constants";
import idl from "@/lib/on-chain/idl.json";
import * as anchor from "@coral-xyz/anchor";
import { BangerProgram } from "@/types/program";
import dotenv from "dotenv";
import prisma from "@/lib/db";
import { updateMarketData } from "@/server/banger/queries";
import BangerProgramIDL from "@/lib/on-chain/idl.json";
import { parseTxType, processBurnTx, processLaunchTx, processMintTx, syncBlockchainData } from "@/server/dbSync";
import { getLatestBlockchainData } from "@/lib/on-chain/utils";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { das } from "@metaplex-foundation/mpl-core-das";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { publicKey } from "@metaplex-foundation/umi";
import Decimal from "decimal.js";

dotenv.config();

async function updateAssets() {
  const connection = new anchor.web3.Connection(CLUSTER_URL);

  const secret = process.env.SOLANA_PRIVATE_KEY!;
  const nums = secret!.split(",");
  const secretArray = nums.map((val: string) => parseInt(val));
  const secretKey = Uint8Array.from(secretArray);
  const admin = anchor.web3.Keypair.fromSecretKey(secretKey);
  const wallet = new anchor.Wallet(admin);
  const provider = new anchor.AnchorProvider(connection, wallet);
  const program = new anchor.Program<BangerProgram>(idl as BangerProgram, provider);

  const tx = new anchor.web3.Transaction();
  tx.feePayer = ADMIN_PK;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const updateAssetIx = await program.methods
    .updateAssets("https://arweave.net/i7XSMms6nOFWFRSScBtAvh5I-NPamuA2PJyYegqAkQ4")
    .accountsPartial({
      collection: new anchor.web3.PublicKey("7mmAssU9JKbs8r7FFmQZ9gJnbwcqESXneSkuQdmyjXzK"),
    })
    .remainingAccounts([
      {
        pubkey: new anchor.web3.PublicKey("rUHvSyoFVvHMnpKgqxTpSoVzLe9yTJohFJusaNdhMze"),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new anchor.web3.PublicKey("9EcA2XbAZ5q8QQaGZ5KKbgG8CbxTTQ5Wy93qHCPbyLx1"),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new anchor.web3.PublicKey("EaBeJ4a2f8tRnqPEnv5gMh9oyjznFYNeEBqzZw5fNH2E"),
        isSigner: false,
        isWritable: true,
      },
    ])
    .signers([admin])
    .instruction();

  tx.add(updateAssetIx);

  const txSig = await anchor.web3.sendAndConfirmTransaction(connection, tx, [admin]);
  console.log("txSig", txSig);
}

async function updateCollection() {
  const connection = new anchor.web3.Connection(CLUSTER_URL);

  const secret = process.env.SOLANA_PRIVATE_KEY!;
  const nums = secret!.split(",");
  const secretArray = nums.map((val: string) => parseInt(val));
  const secretKey = Uint8Array.from(secretArray);
  const admin = anchor.web3.Keypair.fromSecretKey(secretKey);
  const wallet = new anchor.Wallet(admin);
  const provider = new anchor.AnchorProvider(connection, wallet);
  const program = new anchor.Program<BangerProgram>(idl as BangerProgram, provider);

  const tx = new anchor.web3.Transaction();
  tx.feePayer = ADMIN_PK;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const updateCollectionIx = await program.methods
    .updateCollection("https://arweave.net/3OB2kKGL9mpcn8N2gJX0KP46RMqFsxRuTz9J4Q15F0k")
    .accountsPartial({
      collection: new anchor.web3.PublicKey("Ei3vKfwt3sm1Tb7HQ9VQkvu3CLCMCbchkEod6S1t44Ui"),
    })
    .signers([admin])
    .instruction();

  tx.add(updateCollectionIx);

  const txSig = await anchor.web3.sendAndConfirmTransaction(connection, tx, [admin]);
  console.log("txSig", txSig);
}

async function populateLaunchers() {
  const markets = await prisma.market.findMany();
  console.log("markets length", markets.length);
  for (const market of markets) {
    const launcher = await prisma.launcher.findFirst({
      where: {
        tweetId: market.tweetId,
      },
    });
    if (!launcher) {
      await prisma.launcher.create({
        data: {
          tweetId: market.tweetId,
          launcherId: market.curatorId
        },
      });
    }
  }
}

async function getTransaction() {
  const connection = new anchor.web3.Connection(CLUSTER_URL);
  const tx = await connection.getTransaction(
    "464TXW259ja9QHHios5Y7BBmdcqKPABExzsjYieXqxfHWextLWpZpnyrCd6BJe2De6D1oGbXbkqHNWBuE8Gve39q",
    {
      maxSupportedTransactionVersion: 0,
    }
  );
  console.log(JSON.stringify(tx, null, 2));
}

async function updateMarket() {
  await updateMarketData("5QqGzrPqy9Pqtq4SJCgZbRuqhgbEMJq3VivBPB889GML");
}

async function refundHighFeePayers() {
  const connection = new Connection(CLUSTER_URL, "confirmed");
  const bangerProgramId = new PublicKey(BangerProgramIDL.address);
  const privateKey = process.env.SOLANA_PRIVATE_KEY!;
  const nums = privateKey!.split(",");
  const secretArray = nums.map((val: string) => parseInt(val));
  const secretKey = Uint8Array.from(secretArray);
  const wallet = Keypair.fromSecretKey(secretKey);

  let hasMore = true;
  let lastSignature = "ee8NkhjBPFYpPpPwZPnpw4VmnYiXtKE5DDf1PAFnWK8NyEMuWxvK9YY726Qm2qqJ5zDMKdot3n858aLXcTakT3a";

  const highFeePayers = [];

  while (hasMore) {
    const txs = await getLatestBlockchainData(1000, lastSignature);
    console.log("txs length", txs.length);

    if (txs.length === 0) {
      hasMore = false;
      continue;
    }

    for (let tx of txs as any[]) {
      if (tx?.meta?.fee! >= 300000000) {
        console.log("signature", tx.transaction.signatures[0]);
        const message = tx?.transaction?.message!;
        const accounts = message.accountKeys ? message.accountKeys : message.staticAccountKeys;
        if (!accounts) {
          console.log("accounts not found");
          continue;
        }
        let userPublicKey = accounts[0];
        if (userPublicKey instanceof PublicKey) {
          userPublicKey = userPublicKey.toBase58();
        }

        try {
          const refundTx = new Transaction();
          refundTx.feePayer = wallet.publicKey;
          refundTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          refundTx.add(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: new PublicKey(userPublicKey),
              lamports: tx?.meta?.fee!,
            })
          );

          const txSig = await anchor.web3.sendAndConfirmTransaction(connection, refundTx, [wallet]);
          console.log("txSig", txSig);
        } catch (error) {
          console.log("error", error);
        }
      }
    }
    const lastTx = txs[txs.length - 1];
    if (lastTx?.transaction?.signatures[0]) {
      lastSignature = lastTx.transaction.signatures[0];
    }
  }

  console.log("highFeePayers", highFeePayers.length);
}

async function syncAllData() {
  try {
    let hasMore = true;
    let lastSignature: string | undefined;

    while (hasMore) {
      const txs = await getLatestBlockchainData(1000, lastSignature);
      console.log("txs length", txs.length);

      if (txs.length === 0) {
        hasMore = false;
        continue;
      }

      console.log(`Processing batch of ${txs.length} transactions...`);
      for (const tx of txs) {
        if (tx) {
          console.log("tx", JSON.stringify(tx, null, 2));
          const txType = parseTxType(tx);
          if (txType === "mint") {
            const result = await processMintTx(tx);
            console.log("mint tx result", result);
            if (result && result.status === 200) {
              console.log(result.message);
            }
          } else if (txType === "burn") {
            const result = await processBurnTx(tx);
            console.log("burn tx result", result);
            if (result && result.status === 200) {
              console.log(result.message);
            }
          } else if (txType === "launch") {
            const result = await processLaunchTx(tx);
            console.log("launch tx result", result);
            if (result && result.status === 200) {
              console.log(result.message);
            }
          }
        }
      }

      const lastTx = txs[txs.length - 1];
      if (lastTx?.transaction?.signatures[0]) {
        lastSignature = lastTx.transaction.signatures[0];
      }
    }
  } catch (error) {
    console.error('Sync error:', error)
    // Implement error handling
  }
}

async function updateBangerRarities() {
  const umi = createUmi(CLUSTER_URL).use(mplCore()).use(dasApi());
  
  const bangers = await prisma.banger.findMany({
    where: {
      rarity: null,
    }
  });
  console.log("bangers length", bangers.length);

  for (const banger of bangers) {
    console.log("banger", banger);
    const account = banger.address;
    let data;
    try {
      data = await das.getAsset(umi, publicKey(account!));
    } catch (error: any) {
      console.log("error", error);
      const errorMessage = error.message;
      if (errorMessage.includes("Asset not found")) {
        // Remove from db
        await prisma.banger.delete({
          where: { id: banger.id },
        });
        await prisma.trade.deleteMany({
          where: { bangerId: banger.id },
        });
        continue;
      }
    }

    const rarity = data?.attributes?.attributeList[0].value; 

    await prisma.banger.update({
      where: { id: banger.id },
      data: { rarity },
    });
  }
}

async function getStats() {
  const trades = await prisma.trade.findMany({
    select: {
      price: true,
    },
    where: {
      authorId: {
        equals: "21487b45-0872-441a-8481-affe91b4ece3"
      }
    }
  });
  const totalVolume = trades.reduce((acc, trade) => acc.add(trade.price), new Decimal(0));
  console.log("totalVolume", totalVolume.toString());

  const realUsers = await prisma.userProfile.findMany({
    where: {
      email: {
        not: null,
      },
    }
  });
  console.log("realUsers", realUsers.length);
}

async function getAuthorRewards() {
  const authorVault = await anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("author_vault"), Buffer.from("2327407569")],
    new anchor.web3.PublicKey(BangerProgramIDL.address)
  )[0];
  console.log("authorVault", authorVault.toString());
}

async function removeFailedTrades() {
  const connection = new Connection(CLUSTER_URL, "finalized");
  const trades = await prisma.trade.findMany({
    take: 100,
    orderBy: {
      createdAt: "desc",
    },
  });
  for (const trade of trades) {
    const tx = await connection.getTransaction(trade.txId, {
      maxSupportedTransactionVersion: 0,
    });
    const meta = tx?.meta;
    if (meta?.err) {
      console.log('trade', trade);
      console.log('tx', tx);
      console.log("deleting trade", trade.id);
      await prisma.trade.delete({
        where: { id: trade.id },
      });
    }
  }
}

//getStats();
//removeFailedTrades();
//syncAllData();

//refundHighFeePayers();
updateMarket();

//populateLaunchers();
