"use server";
import prisma, { redisPool } from "@/lib/db";
import { $Enums, Prisma } from "@prisma/client";
import {
  CreateMarketIndex,
  MarketPageData,
  MarketWithNumbers,
  TrendingMarket,
} from "@/types/queries";
import { createClient } from "@/lib/supabase/server";
import { CreateMarketRequestType } from "./zod";
import { initPool } from "@/lib/on-chain/init-pool";
import { createRedisUserIndex, getCurrentUser } from "./user";
import { PublicKey } from "@solana/web3.js";
import { AUTHOR_VAULT_DATA } from "@/lib/on-chain/constants";
import BangerProgramIDL from "@/lib/on-chain/idl.json";
import { formatMarket } from "@/lib/utils";

async function formatRemainingTime(timeRemaining: number): Promise<string> {
  // Convert milliseconds to hours, minutes, seconds
  const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

  // Pad with zeros for consistent format
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

const cooldownDuration = 4 * 60 * 60 * 1000;

type coolDownType = {
  canCreate: boolean;
  timeRemaining: number;
  error?: string;
};

async function checkCoolDown(userId: string): Promise<coolDownType> {
  const lastMarket = await prisma.market.findFirst({
    where: {
      curatorId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
    },
  });
  if (!lastMarket) {
    return { canCreate: true, timeRemaining: 0 };
  }
  const now = Date.now();
  const lastCreationTime = lastMarket.createdAt.getTime();
  const timeSinceLastCreation = now - lastCreationTime;
  const timeRemaining = Math.max(0, cooldownDuration - timeSinceLastCreation);

  if (timeRemaining > 0) {
    const formattedTime = await formatRemainingTime(timeRemaining);
    return {
      canCreate: false,
      timeRemaining,
      error: `You can create a new market after ${formattedTime}`,
    };
  }

  return { canCreate: true, timeRemaining: 0 };
}

async function getMarketData(tweetId: string) {
  const supabase = createClient();
  const {
    data: { user: supaUser },
  } = await supabase.auth.getUser();

  // First get the market to use its ID in subsequent queries
  const market = await prisma.market.findUnique({
    where: { tweetId: tweetId },
  });

  if (!market) {
    return null;
  }

  const [rawMarketData, rankQuery, uniqueHolders, topCollectors, userTrades] =
    await prisma.$transaction([
      prisma.market.findUnique({
        where: { tweetId: tweetId },
        select: {
          id: true,
          createdAt: true,
          mediaId: true,
          tweetId: true,
          authorId: true,
          supply: true,
          buyPrice: true,
          sellPrice: true,
          marketCap: true,
          metadataURL: true,
          lookupTableAddress: true,
          collectionPublicKey: true,
          authorVaultPublicKey: true,
          signature: true,
          author: {
            select: {
              username: true,
              image: true,
            },
          },
          media: {
            select: {
              id: true,
              platform: true,
              authorId: true,
              imageUrl: true,
              createdAt: true,
              name: true,
            },
          },
          trades: {
            select: {
              type: true,
              price: true,
              supplyAfterTrade: true,
              createdAt: true,
              txId: true,
              user: {
                select: {
                  username: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      }),
      prisma.$queryRaw<[{ rank: number }]>`
        SELECT rank
        FROM (
          SELECT "tweetId",
            RANK() OVER (ORDER BY supply DESC) as rank
          FROM "Market"
        ) ranked
        WHERE "tweetId" = ${tweetId}
      `,
      prisma.$queryRaw<[{ unique_holders: number }]>`
        SELECT COUNT(DISTINCT "ownerId") as unique_holders
        FROM "Banger" b
        JOIN "Market" m ON b."marketId" = m.id
        WHERE m."tweetId" = ${tweetId} AND b."hasBeenBurned" = false
      `,
      prisma.$queryRaw<
        { rank: number; username: string; image: string; amount: number }[]
      >`
        SELECT
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank,
          up.username,
          up.image,
          COUNT(*) as amount
        FROM "Banger" b
        JOIN "UserProfile" up ON b."ownerId" = up.id
        JOIN "Market" m ON b."marketId" = m.id
        WHERE m."tweetId" = ${tweetId} AND b."hasBeenBurned" = false
        GROUP BY up.id, up.username, up.image
        ORDER BY amount DESC
        LIMIT 10
      `,
      // New query to get user's trade history and total spent
      prisma.$queryRaw<[{ total_spent: string }]>`
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN type = 'BUY' THEN price
              ELSE 0 
            END
          ), 0) as total_spent
        FROM "Trade" t
        JOIN "UserProfile" up ON t."userId" = up.id
        WHERE t."marketId" = ${market.id}
        ${
          supaUser
            ? Prisma.sql`AND up."twitterId" = ${supaUser.user_metadata.provider_id}`
            : Prisma.sql``
        }
      `,
    ]);

  if (!rawMarketData) {
    return null;
  }

  const { trades, ...restOfRawMarketData } = rawMarketData;

  // group trades by txId
  const groupedTrades = trades.reduce((acc, trade) => {
    const txId = trade.txId;
    acc[txId] = acc[txId] || [];
    acc[txId].push(trade);
    return acc;
  }, {} as Record<string, any[]>);

  const mappedTrades = Object.entries(groupedTrades).map(([txId, trades]) => {
    // if trade is a sell type, select the trade with the lowest supply after trade, else select with the most supply after trade
    const latestTrade = trades.reduce((latest, current) => {
      if (current.type === $Enums.TradeSide.SELL) {
        return current.supplyAfterTrade < latest.supplyAfterTrade
          ? current
          : latest;
      }
      return current.supplyAfterTrade > latest.supplyAfterTrade
        ? current
        : latest;
    });
    return {
      username: latestTrade.user.username || "Unknown",
      image: latestTrade.user.image || "",
      time: latestTrade.createdAt,
      type: latestTrade.type,
      amount: trades.length,
      totalValue: trades.reduce((acc, trade) => acc + Number(trade.price), 0),
      txId: txId,
      supplyAfterTrade: latestTrade.supplyAfterTrade,
    };
  });

  // Get user's current holdings if user is logged in
  let userHoldings = 0;
  let netWorth = 0;
  if (supaUser) {
    const userBangers = await prisma.banger.findMany({
      where: {
        marketId: market.id,
        owner: { twitterId: supaUser.user_metadata.provider_id },
        hasBeenBurned: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    userHoldings = userBangers.length;

    // Calculate net worth based on bonding curve
    if (userHoldings > 0) {
      const currentSupply = rawMarketData.supply;

      // Calculate sell value for each position
      netWorth = userBangers.reduce((total, _, index) => {
        // Position in the curve when selling
        const positionInCurve = currentSupply - index;
        // Your bonding curve formula: price = supply² / 32000
        const sellPrice = Math.pow(positionInCurve, 2) / 32000;
        return total + sellPrice;
      }, 0);
    }
  }
  // Calculate user stats
  const totalSpent = Number(userTrades[0]?.total_spent || 0);

  const marketData: MarketPageData = {
    ...restOfRawMarketData,
    buyPrice: Number(restOfRawMarketData.buyPrice),
    sellPrice: Number(restOfRawMarketData.sellPrice),
    marketCap: Number(restOfRawMarketData.marketCap),
    media: { ...restOfRawMarketData.media },
    trades: mappedTrades,
    holders: Number(uniqueHolders[0].unique_holders),
    rank: Number(rankQuery[0].rank),
    topCollectors: topCollectors.map((collector) => ({
      rank: Number(collector.rank),
      username: collector.username,
      image: collector.image,
      amount: Number(collector.amount),
    })),
    userStats: supaUser
      ? {
          totalSpent,
          netWorth,
        }
      : undefined,
  };

  return marketData;
}

async function getTrending(limit: number): Promise<TrendingMarket[]> {
  const now = new Date();
  const hoursAgo24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const trendingMarkets = await prisma.trade.groupBy({
    by: ["marketId"],
    where: {
      createdAt: {
        gte: hoursAgo24,
      },
    },
    _sum: {
      price: true,
    },
    orderBy: {
      _sum: {
        price: "desc",
      },
    },
    take: limit,
  });

  const marketIds = trendingMarkets.map((market) => market.marketId);
  const markets = await prisma.market.findMany({
    where: {
      id: {
        in: marketIds,
      },
    },
    include: {
      media: true,
    },
  });

  // Define types for the raw query results
  type Trade = {
    marketId: string;
    price: number;
    createdAt: Date;
  };

  // Get trades closest to 24 hours ago for each market
  const previousTrades = await prisma.$queryRaw<Trade[]>`
      SELECT t."marketId", t."price", t."createdAt"
      FROM "Market" m
      CROSS JOIN LATERAL (
          SELECT "marketId", "price", "createdAt"
          FROM "Trade"
          WHERE "marketId" = m.id
          AND "createdAt" <= ${hoursAgo24.toISOString()}::timestamp
          ORDER BY "createdAt" DESC
          LIMIT 1
      ) t
      WHERE m.id IN (${Prisma.join(marketIds)});
  `;

  // Get most recent trades for each market
  const recentTrades: Trade[] = await prisma.$queryRaw`
      SELECT t."marketId", t."price", t."createdAt"
      FROM "Market" m
      CROSS JOIN LATERAL (
          SELECT "marketId", "price", "createdAt"
          FROM "Trade"
          WHERE "marketId" = m.id
          AND "createdAt" <= ${now.toISOString()}::timestamp
          ORDER BY "createdAt" DESC
          LIMIT 1
      ) t
      WHERE m.id IN (${Prisma.join(marketIds)});
  `;

  // Create a map for easy access to previous and recent trade prices
  const previousTradeMap = new Map(
    previousTrades.map((trade) => [trade.marketId, trade.price])
  );
  const recentTradeMap = new Map(
    recentTrades.map((trade) => [trade.marketId, trade.price])
  );

  // Map the results
  return trendingMarkets.map((market) => {
    const marketDetails = markets.find((m) => m.id === market.marketId);
    const previousPrice = previousTradeMap.get(market.marketId);
    const recentPrice = recentTradeMap.get(market.marketId);

    let percentChange = null;
    if (previousPrice && recentPrice) {
      percentChange = ((recentPrice - previousPrice) / previousPrice) * 100;
    } else {
      percentChange = 0;
    }

    return {
      marketId: market.marketId,
      tradeVolume: Number(market._sum.price || 0),
      media: marketDetails?.media,
      priceChg24h: percentChange,
    };
  });
}

async function getBangerBalance(marketId: string) {
  const supabase = createClient();
  const {
    data: { user: supaUser },
  } = await supabase.auth.getUser();

  if (!supaUser) return null;
  const bangerBalance = await prisma.banger.count({
    where: {
      marketId: marketId,
      hasBeenBurned: false,
      owner: { twitterId: supaUser.user_metadata.provider_id },
    },
  });
  return bangerBalance;
}

async function createMarket(
  data: CreateMarketRequestType
): Promise<MarketWithNumbers | null> {
  try {
    const [launcher, existingAuthor] = await Promise.all([
      getCurrentUser(),
      prisma.userProfile.findFirst({
        where: { twitterId: data.author.twitterId },
      }),
    ]);

    if (!launcher?.twitterId) {
      throw new Error("Launcher not found");
    }

    let author = existingAuthor;

    const authorVaultPublicKey = PublicKey.findProgramAddressSync(
      [Buffer.from(AUTHOR_VAULT_DATA), Buffer.from(data.author.twitterId)],
      new PublicKey(BangerProgramIDL.address)
    )[0];

    if (!author || !author.twitterId) {
      author = await prisma.userProfile.create({
        data: {
          twitterId: data.author.twitterId,
          name: data.author.name,
          username: data.author.username,
          image: data.author.avatarUrl,
          authorVaultPublicKey: authorVaultPublicKey.toBase58(),
        },
      });
    }

    if (!author.twitterId) return null;

    const [_, _upsertLauncher] = await Promise.all([
      createRedisUserIndex(author),
      prisma.launcher.upsert({
        where: {
          tweetId: data.metadata.sourceId,
        },
        update: {
          launcherId: launcher.id,
        },
        create: {
          tweetId: data.metadata.sourceId,
          launcherId: launcher.id,
        },
      }),
    ]);

    // Initialize the pool on-chain and get the data
    const onChainData = await initPool(
      author.twitterId,
      data.rawMetadataUrl,
      data.metadata.sourceId
    );
    if (!onChainData || !onChainData.signature) {
      return null;
    }

    // Create media
    const media = await prisma.media.create({
      data: {
        platform: data.platform,
        imageUrl: data.imageUrl,
        authorId: author.id,
        name: "media",
      },
    });

    // Create market and market index in parallel
    const [market] = await Promise.all([
      prisma.market.create({
        data: {
          tweetId: data.metadata.sourceId,
          lookupTableAddress: onChainData.lookupTableAddress.toBase58(),
          authorVaultPublicKey: onChainData.authorVaultPublicKey.toBase58(),
          collectionPublicKey: onChainData.collectionPublicKey.toBase58(),
          metadataURL: data.rawMetadataUrl,
          supply: 0,
          buyPrice: 0,
          sellPrice: 0,
          marketCap: 0,
          mediaId: media.id,
          authorId: author.id,
          curatorId: launcher.id,
          signature: onChainData.signature,
          metadata: data.metadata,
        },
      }),
      createMarketIndex({
        tweetId: data.metadata.sourceId.toString(),
        text: data.text,
        imageUrl: data.imageUrl,
        author: {
          name: data.author.name,
          username: data.author.username,
          image: data.author.avatarUrl,
          twitterId: data.author.twitterId.toString(),
        },
      }),
    ]);

    const formattedMarket: MarketWithNumbers = {
      ...market,
      buyPrice: Number(market.buyPrice),
      sellPrice: Number(market.sellPrice),
      marketCap: Number(market.marketCap),
    };

    return formattedMarket;
  } catch (error) {
    console.error("Error in createMarket function:", error);
    throw error;
  }
}

async function createMarketIndex(market: CreateMarketIndex) {
  const client = await redisPool.acquire();
  try {
    // Store main market data
    await client.hset(`market:${market.tweetId}`, {
      text: market.text,
      imageUrl: market.imageUrl,
      author: JSON.stringify({
        name: market.author.name,
        username: market.author.username,
        image: market.author.image,
        twitterId: market.author.twitterId,
      }),
    });

    // Create secondary indexes in parallel
    await Promise.all([
      client.zadd(`market:tweetId`, 0, `${market.tweetId}:${market.tweetId}`),
      client.zadd(
        `market:text`,
        0,
        `${market.text.toLowerCase()}:${market.tweetId}`
      ),
      client.zadd(
        `market:author:name`,
        0,
        `${market.author.name.toLowerCase()}:${market.tweetId}`
      ),
      client.zadd(
        `market:author:username`,
        0,
        `${market.author.username.toLowerCase()}:${market.tweetId}`
      ),
      client.zadd(
        `market:author:twitterid`,
        0,
        `${market.author.twitterId}:${market.tweetId}`
      ),
    ]);
  } finally {
    await redisPool.release(client);
  }
}

async function searchMarkets(query: string): Promise<CreateMarketIndex[]> {
  const client = await redisPool.acquire();
  try {
    const isNumeric = /^\d+$/.test(query);
    let tweetIds: string[] = [];

    if (isNumeric) {
      // Search by both tweet ID and author Twitter ID in parallel
      const [byTwitterId, byTweetId] = await Promise.all([
        client.zrangebylex(
          `market:author:twitterid`,
          `[${query}`,
          `[${query}\xff`,
          "LIMIT",
          0,
          5
        ),
        client.zrangebylex(
          `market:tweetId`,
          `[${query}`,
          `[${query}\xff`,
          "LIMIT",
          0,
          5
        ),
      ]);

      tweetIds = Array.from(
        new Set([
          ...byTwitterId.map((item: string) => item.split(":")[1]),
          ...byTweetId.map((item: string) => item.split(":")[1]),
        ])
      );
    } else {
      // Search by text, author name and username in parallel
      const [byText, byAuthorName, byAuthorUsername] = await Promise.all([
        client.zrangebylex(
          `market:text`,
          `[${query.toLowerCase()}`,
          `[${query.toLowerCase()}\xff`,
          "LIMIT",
          0,
          5
        ),
        client.zrangebylex(
          `market:author:name`,
          `[${query.toLowerCase()}`,
          `[${query.toLowerCase()}\xff`,
          "LIMIT",
          0,
          5
        ),
        client.zrangebylex(
          `market:author:username`,
          `[${query.toLowerCase()}`,
          `[${query.toLowerCase()}\xff`,
          "LIMIT",
          0,
          5
        ),
      ]);

      tweetIds = Array.from(
        new Set(
          [...byText, ...byAuthorName, ...byAuthorUsername].map(
            (item: string) => item.split(":")[1]
          )
        )
      );
    }

    const markets = await Promise.all(
      tweetIds.map(async (tweetId) => {
        const marketData = await client.hgetall(`market:${tweetId}`);
        return {
          tweetId,
          text: marketData.text,
          imageUrl: marketData.imageUrl,
          author: JSON.parse(marketData.author),
        };
      })
    );

    return markets;
  } finally {
    await redisPool.release(client);
  }
}

async function createMarketAction(tweet: string): Promise<{
  type: string;
  message?: string;
  market: MarketWithNumbers | null;
}> {
  const url = `https://bangerserver-production.up.railway.app`;
  let tweetId = tweet.split("/")[tweet.split("/").length - 1];

  if (tweetId.includes("?")) {
    tweetId = tweetId.split("?")[0];
  }

  if (!/^\d+$/.test(tweetId)) {
    throw new Error("Invalid tweet ID");
  }
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("No current user found");
  }
  const { canCreate, error } = await checkCoolDown(currentUser.id);
  if (!canCreate) {
    return { type: "cooldown", message: error, market: null }; // Return the formatted time message
  }

  const existingMarket = await prisma.market.findUnique({
    where: { tweetId: tweetId },
  });

  if (existingMarket) {
    return {
      type: "existing",
      message: "Market already exists",
      market: formatMarket(existingMarket),
    };
  }

  const body = { tweetId: tweetId };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return {
      type: "metadata error",
      message: "Error fetching metadata",
      market: null,
    };
  }

  const data = await response.json();
  console.log("data", data);

  if (data.error) {
    if (data.error == "Authorization Error") {
      return {
        type: "authorization error",
        message: "Post from private account",
        market: null,
      };
    }
  }

  const market = await createMarket({
    text: data.text,
    author: {
      name: data.name,
      twitterId: data.twitterId,
      avatarUrl: data.avatarUrl,
      username: data.username,
    },
    imageUrl: data.imageUrl,
    rawMetadataUrl: data.rawMetadataUrl,
    platform: data.platform,
    metadata: {
      sourceId: tweetId,
      sourceUrl: data.sourceUrl,
      sourceAuthoredAt: data.sourceAuthoredAt,
    },
  });

  if (!market) {
    return {
      type: "creation error",
      message: "Error while creating market",
      market: null,
    };
  }

  return { type: "success", message: "Market created successfully", market };
}

export {
  getMarketData,
  getBangerBalance,
  getTrending,
  createMarket,
  createMarketAction,
  searchMarkets,
};
