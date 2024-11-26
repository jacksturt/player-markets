import prisma from "@/lib/db";
import { calculateFromSupply } from "@/lib/utils";
import { $Enums, Trade } from "@prisma/client";
import { getCollectionSupply, getRarity } from "@/lib/on-chain/utils";
import { PublicKey } from "@solana/web3.js";

async function createBangers(
  createdAt: Date,
  mediaId: string,
  marketId: string,
  authorId: string,
  ownerId: string,
  addresses: string[],
) {
  try {
    const rarities = await Promise.all(
      addresses.map(async (address) => {
        return await getRarity(address);
      })
    );
    const bangerIds = await prisma.$transaction(
      addresses.map((address, index) =>
        prisma.banger.upsert({
          where: { address },
          update: {},
          create: {
            createdAt,
            mediaId,
            marketId,
            authorId,
            ownerId,
            address,
            rarity: rarities[index],
          },
          select: { id: true },
        })
      )
    );
    const bangers = bangerIds.map(banger => banger.id);
    return bangers;
  } catch (error) {
    console.error("Failed to create bangers:", error);
    throw error; // Rethrow or handle as needed
  }
}

async function updateBangersAsBurned(
  addresses: string[],
  burnedAt: Date,
) {
  const bangers = await prisma.banger.findMany({
    where: {
      address: { in: addresses },
    },
    select: { id: true },
  });
  if (!bangers.length) return [];
  const bangerIds = bangers.map((banger) => banger.id);
  await prisma.banger.updateMany({
    where: {
      id: { in: bangerIds },
      hasBeenBurned: false,
    },
    data: {
      hasBeenBurned: true,
      burnedAt,
    },
  });
  return bangerIds;
};

async function updateMarketData(
  collectionPublicKey: string
) {
  const supply = await getCollectionSupply(new PublicKey(collectionPublicKey));
  const { buyPrice, sellPrice, marketCap } = calculateFromSupply(supply);
  return prisma.market.update({
    where: { collectionPublicKey },
    data: {
      supply,
      buyPrice,
      sellPrice,
      marketCap,
    },
  });
};

async function createTrades(
  data: {
    createdAt: Date,
    userId: string,
    marketId: string,
    bangerId: string,
    txId: string,
    authorId: string,
    type: $Enums.TradeSide,
    price: number,
    supplyAfterTrade: number,
  }[]
) {
  const trades = await prisma.trade.createMany({
    data: data.map(trade => ({
      createdAt: trade.createdAt,
      userId: trade.userId,
      marketId: trade.marketId,
      bangerId: trade.bangerId,
      txId: trade.txId,
      authorId: trade.authorId,
      type: trade.type,
      price: trade.price,
      supplyAfterTrade: trade.supplyAfterTrade,
    })),
  }) as any as Trade[];
  return trades;
}

export { createTrades, createBangers, updateMarketData, updateBangersAsBurned };