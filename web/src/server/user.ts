"use server";
import prisma, { redisPool } from "@/lib/db";
import {
  CLUSTER_URL,
  AUTHOR_VAULT_RENT_EXEMPTION,
  AUTHOR_VAULT_DATA,
  BANGER_PROGRAM_PK,
} from "@/lib/on-chain/constants";
import { createClient } from "@/lib/supabase/server";
import { RedisUserQuery, UserProfileWithMetadata } from "@/types/db-client";
import { UserProfile } from "@prisma/client";
import {
  FetchedMarkets,
  UserProfileData,
  TopTradesUser,
} from "@/types/queries";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";

// Recursive function to convert Decimal fields to numbers
function convertDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if ("toNumber" in obj && typeof obj.toNumber === "function") {
    return obj.toNumber();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDecimals);
  }

  const convertedObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      convertedObj[key] = convertDecimals(obj[key]);
    }
  }
  return convertedObj;
}

async function getUser(username: string): Promise<UserProfileData | null> {
  const user = await prisma.userProfile.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      twitterId: true,
      metadata: true,
      claimableCuratorRewards: true,
      totalCuratorRewards: true,
      score: true,
      totalAuthorRewards: true,
    },
  });
  if (!user) return null;

  const currentUserFollows = await currentUserFollowProfile(user.id);
  const { marketCap, netWorth } = await getUserMarketCapAndNetWorth(
    user.twitterId!
  );

  // Convert Decimal fields
  const formattedUser: UserProfileData = {
    id: user.id,
    name: user.name,
    username: user.username,
    image: user.image,
    marketCap: Number(marketCap),
    netWorth: Number(netWorth),
    twitterId: user.twitterId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    currentUserFollows,
    secret: (user.metadata as { secret?: string })?.secret ?? null,
    claimableCuratorRewards: user.claimableCuratorRewards
      ? Number(user.claimableCuratorRewards)
      : null,
    totalCuratorRewards: user.totalCuratorRewards
      ? Number(user.totalCuratorRewards)
      : null,
    score: user.score ? Number(user.score) : null,
    totalAuthorRewards: user.totalAuthorRewards
      ? Number(user.totalAuthorRewards)
      : null,
  };

  return formattedUser;
}

async function getUserMarketCapAndNetWorth(
  twitterId: string
): Promise<{ marketCap: number; netWorth: number }> {
  const user = await prisma.userProfile.findUnique({
    where: { twitterId },
    select: { id: true },
  });

  if (!user) {
    return { marketCap: 0, netWorth: 0 };
  }

  const marketCap = await prisma.market.aggregate({
    where: { authorId: user.id },
    _sum: { marketCap: true },
  });

  const bangers = await prisma.banger.findMany({
    where: { ownerId: user.id, hasBeenBurned: false },
    select: {
      market: {
        select: {
          buyPrice: true,
        },
      },
    },
  });

  const calculatedNetWorth = bangers.reduce((sum, banger) => {
    return sum.plus(new Decimal(banger.market.buyPrice));
  }, new Decimal(0));

  return {
    marketCap: Number(marketCap._sum.marketCap) || 0,
    netWorth: calculatedNetWorth.toNumber(),
  };
}

async function getUserMarkets(
  twitterId: string,
  type: "owned" | "launched" | "authored",
  sortBy: "price" | "time" | "volume",
  order: "asc" | "desc"
): Promise<FetchedMarkets[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (type === "owned") {
    const marketsWithRecentTrades = await prisma.banger.findMany({
      where: {
        owner: {
          twitterId: twitterId,
        },
        hasBeenBurned: false,
      },
      include: {
        market: {
          include: {
            media: true,
            trades: {
              orderBy: [{ createdAt: "desc" }, { incrementId: "desc" }],
              take: 1,
            },
          },
        },
      },
      orderBy: {
        market: {
          buyPrice: "desc",
        },
      },
      distinct: ["marketId"],
      take: 50,
    });

    const marketIds = marketsWithRecentTrades.map((banger) => banger.market.id);
    console.log("marketIds", marketIds);

    const oldTradesForMarkets = await prisma.trade.findMany({
      where: {
        marketId: { in: marketIds },
        createdAt: { lt: twentyFourHoursAgo },
      },
      orderBy: [{ createdAt: "desc" }, { incrementId: "desc" }],
      distinct: ["marketId"],
    });

    const oldTradesByMarketId = oldTradesForMarkets.reduce(
      (acc: { [key: string]: (typeof oldTradesForMarkets)[0] }, trade) => {
        acc[trade.marketId] = trade;
        return acc;
      },
      {}
    );

    const bangerCountsByMarket = await prisma.banger.groupBy({
      by: ["marketId", "rarity"],
      where: {
        owner: { twitterId: twitterId },
        hasBeenBurned: false,
        marketId: { in: marketIds },
      },
      _count: {
        _all: true,
      },
    });

    console.log("bangerCountsByMarket", bangerCountsByMarket);

    const formattedMarkets: FetchedMarkets[] = marketsWithRecentTrades.map(
      (banger) => {
        const mostRecentTrade = banger.market.trades[0] || null;
        const mostRecentOldTrade =
          oldTradesByMarketId[banger.market.id] || null;

        const priceChange24h = mostRecentOldTrade
          ? ((Number(mostRecentTrade.price) -
              Number(mostRecentOldTrade.price)) /
              Number(mostRecentOldTrade.price)) *
            100
          : null;

        const ownedBangers = {
          total: 0,
          common: 0,
          rare: 0,
          epic: 0,
          legendary: 0,
        };

        bangerCountsByMarket
          .filter((count) => count.marketId === banger.market.id)
          .forEach((count) => {
            const rarity = count.rarity?.toLowerCase();
            if (
              rarity === "common" ||
              rarity === "rare" ||
              rarity === "epic" ||
              rarity === "legendary"
            ) {
              ownedBangers[rarity] = count._count._all;
              ownedBangers.total += count._count._all;
            }
          });

        return {
          ...banger.market,
          buyPrice: Number(banger.market.buyPrice),
          sellPrice: Number(banger.market.sellPrice),
          marketCap: Number(banger.market.marketCap),
          media: {
            ...banger.market.media,
            userId: banger.ownerId,
            sourceCreatedAt: null,
          },
          priceChange24h,
          trades: banger.market.trades.map((trade) => ({
            ...trade,
            price: Number(trade.price),
          })),
          ownedBangers,
          netWorth: Number(banger.market.buyPrice) * ownedBangers.total,
        };
      }
    );

    formattedMarkets.sort((a, b) => (b.netWorth ?? 0) - (a.netWorth ?? 0));

    return formattedMarkets;
  } else if (type === "launched") {
    const marketsWithRecentTrades = await prisma.market.findMany({
      take: 50,
      orderBy: getOrderByClause(sortBy, order),
      include: {
        media: true,
        trades: {
          orderBy: [{ createdAt: "desc" }, { incrementId: "desc" }],
          take: 1,
        },
      },
      where: {
        curator: {
          twitterId: twitterId,
        },
      },
    });

    const marketIds = marketsWithRecentTrades.map((market) => market.id);

    const oldTradesForMarkets = await prisma.trade.findMany({
      where: {
        marketId: { in: marketIds },
        createdAt: { lt: twentyFourHoursAgo },
      },
      orderBy: [{ createdAt: "desc" }, { incrementId: "desc" }],
      distinct: ["marketId"],
    });
    const oldTradesByMarketId = oldTradesForMarkets.reduce(
      (acc: { [key: string]: (typeof oldTradesForMarkets)[0] }, trade) => {
        acc[trade.marketId] = trade;
        return acc;
      },
      {}
    );

    const markets: FetchedMarkets[] = marketsWithRecentTrades.map((market) => {
      const mostRecentTrade = market.trades[0] || null;
      const mostRecentOldTrade = oldTradesByMarketId[market.id] || null;
      const priceChange24h = mostRecentOldTrade
        ? ((Number(mostRecentTrade.price) - Number(mostRecentOldTrade.price)) /
            Number(mostRecentOldTrade.price)) *
          100
        : null;

      return {
        ...market,
        buyPrice: Number(market.buyPrice),
        sellPrice: Number(market.sellPrice),
        marketCap: Number(market.marketCap),
        media: { ...market.media },
        priceChange24h,
        trades: market.trades.map((trade) => ({
          ...trade,
          price: Number(trade.price),
        })),
      };
    });

    return markets;
  } else if (type === "authored") {
    const marketsWithRecentTrades = await prisma.market.findMany({
      take: 50,
      orderBy: getOrderByClause(sortBy, order),
      include: {
        media: true,
        trades: {
          orderBy: [{ createdAt: "desc" }, { incrementId: "desc" }],
          take: 1,
        },
      },
      where: {
        author: {
          twitterId: twitterId,
        },
      },
    });

    const marketIds = marketsWithRecentTrades.map((market) => market.id);

    const oldTradesForMarkets = await prisma.trade.findMany({
      where: {
        marketId: { in: marketIds },
        createdAt: { lt: twentyFourHoursAgo },
      },
      orderBy: [{ createdAt: "desc" }, { incrementId: "desc" }],
      distinct: ["marketId"],
    });
    const oldTradesByMarketId = oldTradesForMarkets.reduce(
      (acc: { [key: string]: (typeof oldTradesForMarkets)[0] }, trade) => {
        acc[trade.marketId] = trade;
        return acc;
      },
      {}
    );

    const markets: FetchedMarkets[] = marketsWithRecentTrades.map((market) => {
      const mostRecentTrade = market.trades[0] || null;
      const mostRecentOldTrade = oldTradesByMarketId[market.id] || null;
      const priceChange24h = mostRecentOldTrade
        ? ((Number(mostRecentTrade.price) - Number(mostRecentOldTrade.price)) /
            Number(mostRecentOldTrade.price)) *
          100
        : null;

      return {
        ...market,
        buyPrice: Number(market.buyPrice),
        sellPrice: Number(market.sellPrice),
        marketCap: Number(market.marketCap),
        media: { ...market.media },
        priceChange24h,
        trades: market.trades.map((trade) => ({
          ...trade,
          price: Number(trade.price),
        })),
      };
    });

    return markets;
  }

  return [];
}

function getOrderByClause(
  sortBy: "price" | "time" | "volume",
  order: "asc" | "desc"
) {
  switch (sortBy) {
    case "price":
      return { buyPrice: order };
    case "time":
      return { createdAt: order };
    case "volume":
      return { trades: { _count: order } };
  }
}

async function getCurrentUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (!data.user?.user_metadata.user_name || error) return null;

  const user = await prisma.userProfile.findFirst({
    where: { username: data.user.user_metadata.user_name },
  });
  if (!user) return null;

  // Convert Decimal fields
  const convertedUser = convertDecimals(user);

  return convertedUser as UserProfileWithMetadata;
}

async function currentUserFollowProfile(profileId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;
  if (currentUser.id === profileId) return null;
  const follow = await prisma.follow.findFirst({
    where: {
      followerId: currentUser.id,
      followingId: profileId,
    },
  });
  if (follow === null) return false;
  return true;
}

async function followUser(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId: currentUser.id,
      followingId: userId,
    },
  });
  if (existingFollow) return existingFollow;
  const newFollow = await prisma.follow.create({
    data: {
      followerId: currentUser.id,
      followingId: userId,
    },
  });
  return newFollow;
}

async function unfollowUser(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;
  const deleted = await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId: currentUser.id,
        followingId: userId,
      },
    },
  });
  return deleted;
}

// Modify the createRedisUserIndex function to use the connection pool
async function createRedisUserIndex(
  user: UserProfile | UserProfileData | UserProfileWithMetadata
): Promise<void> {
  if (!user.twitterId || !user.name || !user.username || !user.image) return;
  const { twitterId, name, username, image } = user;

  const client = await redisPool.acquire();
  try {
    // Save user data in a hash
    await client.hset(`user:${twitterId}`, {
      twitterId,
      name,
      username,
      image,
    });
    // Add to sorted sets for searching
    await Promise.all([
      client.zadd(
        `users:byUsername`,
        0,
        `${username.toLowerCase()}:${twitterId}`
      ),
      client.zadd(`users:byName`, 0, `${name.toLowerCase()}:${twitterId}`),
      client.zadd(`users:byTwitterId`, 0, `${twitterId}:${twitterId}`),
    ]);
  } finally {
    await redisPool.release(client);
  }
}

async function searchRedisUsers(query: string): Promise<RedisUserQuery[]> {
  const client = await redisPool.acquire();
  try {
    const isNumeric = /^\d+$/.test(query);
    let userIds: string[] = [];

    if (isNumeric) {
      // Search by Twitter ID
      const result = await client.zrangebylex(
        `users:byTwitterId`,
        `[${query}`,
        `[${query}\xff`,
        "LIMIT",
        0,
        1
      );
      userIds = result.map((item: string) => item.split(":")[1]);
    } else {
      // Search by username and name
      const byUsername = await client.zrangebylex(
        `users:byUsername`,
        `[${query.toLowerCase()}`,
        `[${query.toLowerCase()}\xff`,
        "LIMIT",
        0,
        5
      );
      const byName = await client.zrangebylex(
        `users:byName`,
        `[${query.toLowerCase()}`,
        `[${query.toLowerCase()}\xff`,
        "LIMIT",
        0,
        5
      );
      userIds = Array.from(
        new Set(
          [...byUsername, ...byName].map((item: string) => item.split(":")[1])
        )
      );
    }

    const users = await Promise.all(
      userIds.map(async (twitterId) => {
        const userData = await client.hgetall(`user:${twitterId}`);
        return userData as RedisUserQuery;
      })
    );

    return users;
  } finally {
    await redisPool.release(client);
  }
}

async function getCollectionByTwitterId(
  twitterId: string
): Promise<string | null> {
  const user = await prisma.userProfile.findFirst({
    where: {
      twitterId: twitterId,
    },
    select: {
      id: true,
    },
  });

  const market = await prisma.market.findFirst({
    where: {
      authorId: user?.id,
    },
    select: {
      collectionPublicKey: true,
    },
  });

  return market?.collectionPublicKey ?? null;
}

async function getAnyCollection(): Promise<string | null> {
  const market = await prisma.market.findFirst({
    select: {
      collectionPublicKey: true,
    },
  });
  return market?.collectionPublicKey ?? null;
}

async function resetClaimableCuratorRewards(
  twitterId: string,
  signature: string
) {
  const user = await prisma.userProfile.findFirst({
    where: { twitterId: twitterId },
  });
  if (user?.lastClaimedCuratorRewardsSig === signature) return;
  await prisma.userProfile.update({
    where: { twitterId: twitterId },
    data: {
      claimableCuratorRewards: 0,
      lastClaimedCuratorRewardsSig: signature,
    },
  });
}

async function getUserCuratorRewards(twitterId: string) {
  const user = await prisma.userProfile.findFirst({
    where: { twitterId: twitterId },
    select: {
      score: true,
      claimableCuratorRewards: true,
      totalCuratorRewards: true,
    },
  });
  return {
    score: Number(user?.score),
    claimable: Number(user?.claimableCuratorRewards),
    total: Number(user?.totalCuratorRewards),
  };
}

async function getUserInvites(userId: string) {
  const invites = await prisma.invite.findMany({
    where: { inviterId: userId },
    select: {
      code: true,
      uses: true,
    },
  });
  return invites;
}

// // Update the UserProfileWithMetadata interface
// interface UserProfileWithMetadata {
//   id: string;
//   username: string | null;
//   name: string | null;
//   email: string | null;
//   image: string | null;
//   marketCap: number | null;
//   createdAt: Date;
//   updatedAt: Date;
//   twitterId: string | null;
//   authId: string | null;
//   metadata: any;
//   inviteId: string | null;
//   claimableCuratorRewards: number | null;
//   totalCuratorRewards: number | null;
//   score: number | null;
//   totalAuthorRewards: number | null;
// }

// // Update UserProfileData interface
// interface UserProfileData {
//   id: string;
//   name: string | null;
//   username: string | null;
//   image: string | null;
//   twitterId: string | null;
//   marketCap: number;
//   netWorth: number;
//   createdAt: Date;
//   updatedAt: Date;
//   currentUserFollows: boolean | null;
//   secret: string | null;
//   claimableCuratorRewards: number | null;
//   totalCuratorRewards: number | null;
//   score: number | null;
//   totalAuthorRewards: number | null;
// }

async function getServerUser() {
  const supabase = createClient();
  const {
    data: { user: supaUser },
  } = await supabase.auth.getUser();

  if (!supaUser) {
    throw new Error("There was an error authenticating the user");
  }
  const user = await prisma.userProfile.findFirst({
    where: { twitterId: supaUser.user_metadata.provider_id },
  });
  return user;
}

async function verifyWallet(twitterId: string, publicKey: string) {
  const user = await prisma.userProfile.findFirst({
    where: {
      twitterId: twitterId,
    },
  });
  console.log("twitterId", twitterId);
  console.log("publicKey", publicKey);
  console.log("user", user);
  const wallet = await prisma.wallet.findFirst({
    where: {
      publicKey: publicKey,
      userId: user?.id,
    },
  });
  console.log("wallet", wallet);
  if (!wallet) {
    await prisma.wallet.create({
      data: { publicKey, userId: user?.id },
    });
  }
}

async function getUserAuthorRewards(authorId: string) {
  const connection = new Connection(CLUSTER_URL, {
    commitment: "processed",
    confirmTransactionInitialTimeout: 100000,
  });
  const creatorVaultPublicKey = PublicKey.findProgramAddressSync(
    [Buffer.from(AUTHOR_VAULT_DATA), Buffer.from(authorId)],
    BANGER_PROGRAM_PK
  )[0];
  const balance = await connection.getBalance(creatorVaultPublicKey);
  console.log(balance);
  const claimable =
    balance > AUTHOR_VAULT_RENT_EXEMPTION
      ? (balance - AUTHOR_VAULT_RENT_EXEMPTION) / LAMPORTS_PER_SOL
      : 0;
  const user = await prisma.userProfile.findFirst({
    where: { twitterId: authorId },
    select: { totalAuthorRewards: true },
  });
  return { claimable, total: Number(user?.totalAuthorRewards) };
}

async function getFollowSuggestions(): Promise<TopTradesUser[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const topUsers = await prisma.trade.groupBy({
    by: ["userId"],
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 10,
  });

  // Fetch user profiles based on the userIds
  const userIds = topUsers.map((group) => group.userId);
  const users = await prisma.userProfile.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
  });

  // Merge the counts with user profiles
  const result = topUsers.map((group) => {
    const user = users.find((u) => u.id === group.userId);
    if (!user) return null;
    return {
      user,
      tradeCount: group._count.id,
    };
  });

  return result.filter((user) => user !== null);
}

// function to handle the final onboarding step
async function completeOnboarding(userIds: string[]) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("No user found");

    // Transaction ensures all or nothing - either all follows succeed and alpha access is granted, or nothing happens
    await prisma.$transaction(async (tx) => {
      // Follow all selected users
      for (const userId of userIds) {
        await tx.follow.create({
          data: {
            followerId: currentUser.id,
            followingId: userId,
          },
        });
      }

      // Only set alphaAccess after successful follows
      await tx.userProfile.update({
        where: {
          id: currentUser.id,
        },
        data: {
          metadata: {
            ...currentUser.metadata,
            alphaAccess: true,
            followRequirementMet: true,
          },
        },
      });
    });

    return true;
  } catch (error) {
    console.error("Error completing onboarding:", error);
    throw error;
  }
}
export {
  getUser,
  getUserMarkets,
  getCurrentUser,
  followUser,
  unfollowUser,
  createRedisUserIndex,
  searchRedisUsers,
  getCollectionByTwitterId,
  getAnyCollection,
  resetClaimableCuratorRewards,
  getUserCuratorRewards,
  getUserInvites,
  getServerUser,
  verifyWallet,
  getUserAuthorRewards,
  getFollowSuggestions,
  completeOnboarding,
};
