import prisma from '@/lib/db'  // Your existing prisma client
import * as queries from "@/server/banger/queries";
import { $Enums } from "@prisma/client";
import { calculateTotalPrice, findStartingSupply } from "@/lib/utils";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { getLatestBlockchainData } from "@/lib/on-chain/utils";
import { BorshInstructionCoder, Idl, Program } from '@coral-xyz/anchor';
import BangerProgramIdl from "@/lib/on-chain/idl.json";
import { resetClaimableCuratorRewards } from './user';

export async function syncBlockchainData() {
  try {
    const txs = await getLatestBlockchainData(20);
    for (const tx of txs) {
      if (tx) {
        console.log("tx", JSON.stringify(tx, null, 2));
        const txType = parseTxType(tx);
        if (tx.meta?.err) {
          console.log("tx error", tx.meta.err);
          continue;
        }
        if (txType === "mint") {
          const result = await processMintTx(tx);
          console.log("mint tx result", result);
          if (result && result.status !== 200) {
            console.log(result.message);
          }
        } else if (txType === "burn") {
          const result = await processBurnTx(tx);
          console.log("burn tx result", result);
          if (result && result.status !== 200) {
            console.log(result.message);
          }
        } else if (txType === "launch") {
          const result = await processLaunchTx(tx);
          console.log("launch tx result", result);
          if (result && result.status !== 200) {
            console.log(result.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Sync error:', error)
    // Implement error handling
  }
}

export function parseTxType(tx: any) {
  const logs = tx.meta.logMessages.join('\n');
  if (logs.includes("Instruction: Mint")) {
    return "mint";
  } else if (logs.includes("Instruction: Burn")) {
    return "burn";
  } else if (logs.includes("Instruction: LaunchMarket")) {
    return "launch";
  }
  return null;
}

export async function processMintTx(data: any) {
  console.log("mint tx");

  const signatures = data.transaction.signatures;
  console.log('signatures', signatures);

  let tradeExists;
  try {
    tradeExists = await prisma.trade.findFirst({
      where: {
      txId: { in: signatures },
      },
    });
  } catch (error) {
    console.log("error checking for trade", error);
    return { message: "Error checking for trade", status: 500 };
  }

  if (tradeExists) {
    return { message: "Trade already processed", status: 200 };
  }

  const timestamp = data.blockTime * 1000;
  const message = data.transaction.message;
  const meta = data.meta;
  const accounts = message.accountKeys ? message.accountKeys : message.staticAccountKeys;
  if (!accounts) {
    return { message: "Mint static accounts not found", status: 400 };
  }
  let userPublicKey = accounts[0];
  if (userPublicKey instanceof PublicKey) {
    userPublicKey = userPublicKey.toBase58();
  }
  const instructions = message.instructions ? message.instructions : message.compiledInstructions;
  if (!instructions) {
    return { message: "Mint instructions not found", status: 400 };
  }
  const instruction = instructions[0];
  const instructionAccounts = instruction.accounts ? instruction.accounts : instruction.accountKeyIndexes;
  if (!instructionAccounts) {
    return { message: "Mint instruction accounts not found", status: 400 };
  }
  const assetIndices = instructionAccounts.slice(11);
  let assetKeys = assetIndices.map((index: number) => accounts[index]);
  if (assetKeys.some((key: any) => key instanceof PublicKey)) {
    assetKeys = assetKeys.map((key: any) => key.toBase58());
  }
  let collectionKey = meta.loadedAddresses.writable[0];
  if (collectionKey instanceof PublicKey) {
    collectionKey = collectionKey.toBase58();
  }
  const poolIndex = accounts.length + 3;
  console.log('collectionKey', collectionKey);
  console.log('assetKeys', assetKeys);
  console.log('poolIndex', poolIndex);
  console.log('instructionAccounts', instructionAccounts);
  console.log('accounts', accounts);
  console.log('assetIndices', assetIndices);

  const market = await prisma.market.findFirst({
    where: {
      collectionPublicKey: collectionKey,
    },
    include: {
      media: true,
      author: true,
    },
  });
  console.log('market', market);

  if (!market) {
    return { message: "Market not found", status: 400 };
  }

  const userWallet = await prisma.wallet.findFirst({
    where: {
      publicKey: userPublicKey,
    },
    include: {
      user: true,
    },
  });
  console.log('userWallet', userWallet);

  const userId = userWallet?.user?.id || "static-unknown-user-id";
  try {
    await queries.updateMarketData(market.collectionPublicKey);
  } catch (error) {
    console.log("error updating market data", error);
  }

  const bangers = await queries.createBangers(
    new Date(timestamp),
    market.mediaId,
    market.id,
    market.authorId,
    userId,
    assetKeys
  );
  console.log('bangers', bangers);

  const totalToPool = (new Decimal(meta.postBalances[poolIndex])).sub(new Decimal(meta.preBalances[poolIndex])).div(new Decimal(LAMPORTS_PER_SOL));
  const startingSupply = findStartingSupply(totalToPool, new Decimal(assetKeys.length), 'mint');
  const suppliesAfterTrades = Array.from({ length: assetKeys.length }, (_, i) => startingSupply.plus(i).plus(1));
  const prices = suppliesAfterTrades.map((supply) => calculateTotalPrice(supply.minus(1), new Decimal(1), 'mint'));
  console.log('prices', prices);
  console.log('suppliesAfterTrades', suppliesAfterTrades);
  console.log('totalToPool', totalToPool);
  console.log('startingSupply', startingSupply);

  const tradesData = bangers.map((banger, idx) => ({
    createdAt: new Date(timestamp),
    userId: userId,
    marketId: market.id,
    bangerId: banger,
    txId: signatures[0],
    authorId: market.authorId,
    type: $Enums.TradeSide.BUY,
    price: prices[idx].toNumber(),
    supplyAfterTrade: suppliesAfterTrades[idx].toNumber(),
  }));

  try {
    await queries.createTrades(tradesData);
  } catch (error) {
    console.log("error creating trades", error);
    return { message: "Error creating trades", status: 500 };
  }
  return { message: "Trades created", status: 200 };
}

export async function processBurnTx(data: any) {
  console.log("burn tx");

  const signatures = data.transaction.signatures;

  let tradeExists;
  try { 
    tradeExists = await prisma.trade.findFirst({
      where: {
        txId: signatures[0],
      },
    });
  } catch (error) {
    console.log("error checking for trade", error);
    return { message: "Error checking for trade", status: 500 };
  }

  if (tradeExists) {
    return { message: "Trade already processed", status: 200 };
  }

  const timestamp = data.blockTime * 1000;
  const message = data.transaction.message;
  const meta = data.meta;
  const accounts = message.accountKeys ? message.accountKeys : message.staticAccountKeys;
  if (!accounts) {
    return { message: "Burn static accounts not found", status: 400 };
  }
  let userPublicKey = accounts[0];
  if (userPublicKey instanceof PublicKey) {
    userPublicKey = userPublicKey.toBase58();
  }
  const instructions = message.instructions ? message.instructions : message.compiledInstructions;
  if (!instructions) {
    return { message: "Burn instructions not found", status: 400 };
  }
  const instruction = instructions[0];
  const instructionAccounts = instruction.accounts ? instruction.accounts : instruction.accountKeyIndexes;
  if (!instructionAccounts) {
    return { message: "Burn instruction accounts not found", status: 400 };
  }
  const assetIndices = instructionAccounts.slice(10);
  let assetKeys = assetIndices.map((index: number) => accounts[index]);
  if (assetKeys.some((key: any) => key instanceof PublicKey)) {
    assetKeys = assetKeys.map((key: any) => key.toBase58());
  }
  const collectionIndex = instructionAccounts[4];
  let collectionKey = accounts[collectionIndex];
  if (collectionKey instanceof PublicKey) {
    collectionKey = collectionKey.toBase58();
  }
  const poolIndex = instructionAccounts[6];
  console.log('collectionKey', collectionKey);
  console.log('instructionAccounts', instructionAccounts);
  console.log('accounts', accounts);
  console.log('assetIndices', assetIndices);
  console.log('assetKeys', assetKeys);

  const market = await prisma.market.findFirst({
    where: {
      collectionPublicKey: collectionKey,
    },
    include: {
      media: true,
      author: true,
    },
  });

  if (!market) {
    return { message: "Market not found", status: 400 };
  }

  const userWallet = await prisma.wallet.findFirst({
    where: {
      publicKey: userPublicKey,
    },
    include: {
      user: true,
    },
  });

  const userId = userWallet?.user?.id || "static-unknown-user-id";

  try {
    await queries.updateMarketData(market.collectionPublicKey);
  } catch (error) {
    console.log("error updating market data", error);
  }

  const bangers = await queries.updateBangersAsBurned(assetKeys, new Date(timestamp));

  const totalFromPool = (new Decimal(meta.preBalances[poolIndex])).sub(new Decimal(meta.postBalances[poolIndex])).div(new Decimal(LAMPORTS_PER_SOL));
  const startingSupply = findStartingSupply(totalFromPool, new Decimal(assetKeys.length), 'burn');
  const suppliesAfterTrades = Array.from({ length: assetKeys.length }, (_, i) => startingSupply.minus(i).minus(1));
  const prices = suppliesAfterTrades.map((supply) => calculateTotalPrice(supply.plus(1), new Decimal(1), 'burn'));
  console.log('prices', prices);
  console.log('suppliesAfterTrades', suppliesAfterTrades);
  console.log('totalFromPool', totalFromPool);
  console.log('startingSupply', startingSupply);

  const tradesData = bangers.map((banger, idx) => ({
    createdAt: new Date(timestamp),
    userId: userId,
    marketId: market.id,
    bangerId: banger,
    txId: signatures[0],
    authorId: market.authorId,
    type: $Enums.TradeSide.SELL,
    price: prices[idx].toNumber(),
    supplyAfterTrade: suppliesAfterTrades[idx].toNumber(),
  }));
  console.log('tradesData', tradesData);

  try {
    await queries.createTrades(tradesData);
  } catch (error) {
    console.log("error creating trades", error);
    return { message: "Error creating trades", status: 500 };
  }
  return { message: "Trades created", status: 200 };
}

interface DecodedInstructionData {
  token_metadata_uri: string;
}

export async function processLaunchTx(data: any) {
  console.log("launch tx");

  const message = data.transaction.message;
  const accounts = message.accountKeys ? message.accountKeys : message.staticAccountKeys;
  if (!accounts) {
    return { message: "Launch static accounts not found", status: 400 };
  }
  const instructions = message.instructions ? message.instructions : message.compiledInstructions;
  if (!instructions) {
    return { message: "Launch instructions not found", status: 400 };
  }
  const launchInstruction = instructions[2];
  const launchInstructionAccounts = launchInstruction.accounts ? launchInstruction.accounts : launchInstruction.accountKeyIndexes;
  if (!launchInstructionAccounts) {
    return { message: "Launch instruction accounts not found", status: 400 };
  }
  const collectionIndex = launchInstructionAccounts[6];
  let collectionKey = accounts[collectionIndex];
  if (collectionKey instanceof PublicKey) {
    collectionKey = collectionKey.toBase58();
  }
  console.log('collectionKey', collectionKey);
  console.log('type of collectionKey', typeof collectionKey);
  
  const timestamp = data.blockTime * 1000;
  const authorVaultIndex = launchInstructionAccounts[7];
  let authorVaultKey = accounts[authorVaultIndex];
  if (authorVaultKey instanceof PublicKey) {
    authorVaultKey = authorVaultKey.toBase58();
  }
  const coder = new BorshInstructionCoder(BangerProgramIdl as Idl);

  // Decode the instruction
  const decodedIx = coder.decode(
    Buffer.from(launchInstruction.data),
    'base58'
  );
  console.log('decodedIx', decodedIx);

  // Access the metadata URL from the decoded data
  console.log('decodedIx.data', decodedIx?.data);
  const metadataUrl = (decodedIx?.data as DecodedInstructionData).token_metadata_uri;
  console.log('metadataUrl', metadataUrl);
  let metadata;
  try {
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      return { message: "Error fetching metadata", status: 400 };
    }
    metadata = await response.json();
  } catch (error) {
    return { message: "Error fetching metadata", status: 400 };
  }

  const sourceAttribute = metadata.attributes.find(
    (attr: { trait_type: string, value: string }) => attr.trait_type === "Source"
  );
  const tweetUrl = sourceAttribute.value;
  let tweetId = tweetUrl.split("/")[tweetUrl.split("/").length - 1];
  if (tweetId.includes("?")) {
    tweetId = tweetId.split("?")[0];
  }

  let marketExists;
  try {
    marketExists = await prisma.market.findFirst({
      where: {
        tweetId: tweetId,
      },
    });
  } catch (error) {
    console.log("error checking for market", error);
    return { message: "Error checking for market", status: 500 };
  }
  if (marketExists) {
    return { message: "Market already exists", status: 200 };
  }

  const launcher = await prisma.launcher.findFirst({
    where: {
      tweetId: tweetId,
    }
  });
  if (!launcher) {
    return { message: "Launcher not found", status: 400 };
  }

  const createLookupTableInstruction = instructions[0];
  const createLookupTableInstructionAccounts = createLookupTableInstruction.accounts ? createLookupTableInstruction.accounts : createLookupTableInstruction.accountKeyIndexes;
  if (!createLookupTableInstructionAccounts) {
    return { message: "Create lookup table instruction accounts not found", status: 400 };
  }
  const lookupTableIndex = createLookupTableInstructionAccounts[0];
  let lookupTableKey = accounts[lookupTableIndex];
  if (lookupTableKey instanceof PublicKey) {
    lookupTableKey = lookupTableKey.toBase58();
  }

  const authorAttribute = metadata.attributes.find(
    (attr: { trait_type: string, value: string }) => attr.trait_type === "Author"
  );
  const authorTwitterId = authorAttribute.value;
  const author = await prisma.userProfile.findFirst({
    where: {
      twitterId: authorTwitterId,
    },
  });

  if (!author) {
    return { message: "Author not found", status: 400 };
  }

  const imageUrl = metadata.image;

  // Create media
  let media;
  try {
    media = await prisma.media.findFirst({
      where: {
        imageUrl: imageUrl,
        authorId: author.id,
      },
    });

    if (!media) {
      media = await prisma.media.create({
        data: {
          platform: "x",
          imageUrl: imageUrl,
          authorId: author.id,
          name: "media",
        },
      });
    }
  } catch (error) {
    return { message: "Error checking for media", status: 500 };
  }

  const authoredAtAttribute = metadata.attributes.find(
    (attr: { trait_type: string, value: string }) => attr.trait_type === "Authored At"
  );
  const authoredAt = authoredAtAttribute.value;

  // Create market
  const market = await prisma.market.create({
    data: {
      tweetId: tweetId,
      createdAt: new Date(timestamp),
      lookupTableAddress: lookupTableKey,
      authorVaultPublicKey: authorVaultKey,
      collectionPublicKey: collectionKey,
      metadataURL: metadataUrl,
      supply: 0,
      buyPrice: 0,
      sellPrice: 0,
      marketCap: 0,
      mediaId: media.id,
      authorId: author.id,
      curatorId: launcher.launcherId,
      signature: data.signature,
      metadata: {
        sourceId: tweetId,
        sourceUrl: tweetUrl,
        sourceAuthoredAt: authoredAt,
      },
    },
  });

  await queries.updateMarketData(market.collectionPublicKey);

  return { message: "Market created", status: 200 };
}

export async function processClaimCuratorRewardsTx(data: any) {
  const message = data.transaction.message;
  const accounts = message.accountKeys ? message.accountKeys : message.staticAccountKeys;
  if (!accounts) {
    return { message: "Claim curator rewards static accounts not found", status: 400 };
  }
  let userPublicKey = accounts[0];
  if (userPublicKey instanceof PublicKey) {
    userPublicKey = userPublicKey.toBase58();
  }
  const userWallet = await prisma.wallet.findFirst({
    where: {
      publicKey: userPublicKey,
    },
    include: {
      user: true,
    },
  });

  await resetClaimableCuratorRewards(userWallet?.user?.twitterId!, data.signature);
  return { message: "Claimed curator rewards", status: 200 };
}
