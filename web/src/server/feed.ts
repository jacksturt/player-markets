"use server";
import prisma from "@/lib/db";
import { Activity, ActivityType } from "@/types/queries";
import { getCurrentUser } from "./user";
import { $Enums } from "@prisma/client";

async function getGlobalActivities(limit: number = 20): Promise<Activity[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const query = `
  WITH combined_activities AS (
    (
      -- Trades
      SELECT 
        CASE 
          WHEN t.type = 'BUY' THEN 'MINT'
          ELSE 'BURN'
        END as activity_type,
        m.id,
        m."tweetId" as tweet_id,
        m."createdAt" as market_created_at,
        m.supply,
        m."buyPrice" as buy_price,
        med.id as media_id,
        med.platform,
        med."authorId" as media_author_id,
        med."imageUrl" as image_url,
        med."createdAt" as media_created_at,
        med.name as media_name,
        uTrader.name as name,
        uTrader.username as username,
        uTrader."twitterId" as twitter_id,
        uTrader.image as image,
        uAuthor.username as author_username,
        t."createdAt" as activity_created_at
      FROM "public"."Trade" t
      JOIN "public"."Market" m ON t."marketId" = m.id
      JOIN "public"."Media" med ON m."mediaId" = med.id
      JOIN "public"."UserProfile" uTrader ON t."userId" = uTrader.id
      JOIN "public"."UserProfile" uAuthor ON m."authorId" = uAuthor.id
      WHERE t.id IN (
        SELECT DISTINCT ON ("txId") id 
        FROM "public"."Trade" 
        ORDER BY "txId", "createdAt" DESC
      )
      ORDER BY t."createdAt" DESC
      LIMIT $1
    )
    UNION ALL
    (
      -- Launches
      SELECT 
        'LAUNCH' as activity_type,
        m.id,
        m."tweetId" as tweet_id,
        m."createdAt" as market_created_at,
        m.supply,
        m."buyPrice" as buy_price,
        med.id as media_id,
        med.platform,
        med."authorId" as media_author_id,
        med."imageUrl" as image_url,
        med."createdAt" as media_created_at,
        med.name as media_name,
        uCurator.name as name,
        uCurator.username as username,
        uCurator."twitterId" as twitter_id,
        uCurator.image as image,
        uAuthor.username as author_username,
        m."createdAt" as activity_created_at
      FROM "public"."Market" m
      JOIN "public"."Media" med ON m."mediaId" = med.id
      JOIN "public"."UserProfile" uCurator ON m."curatorId" = uCurator.id
      JOIN "public"."UserProfile" uAuthor ON m."authorId" = uAuthor.id
      WHERE m."curatorId" IS NOT NULL
      ORDER BY m."createdAt" DESC
      LIMIT $1
    )
  ),
  market_ids AS (
    SELECT DISTINCT id
    FROM combined_activities
  ),
  old_prices AS (
    SELECT DISTINCT ON (m.id)
      m.id as "marketId",
      COALESCE(t.price, 0.00003125) as old_price
    FROM "Market" m
    LEFT JOIN "Trade" t ON t."marketId" = m.id AND t."createdAt" < NOW() - INTERVAL '24 HOURS'
    WHERE m.id IN (SELECT id FROM market_ids)
    ORDER BY m.id, t."createdAt" DESC
  ),
  combined_activities_with_price_change AS (
    SELECT
      ca.*,
      (ca.buy_price - op.old_price) / op.old_price * 100 as price_change
    FROM combined_activities ca
    LEFT JOIN old_prices op ON ca.id = op."marketId"
  )
  SELECT *
  FROM combined_activities_with_price_change
  ORDER BY activity_created_at DESC
  LIMIT $1;
`;

  const results = await prisma.$queryRawUnsafe<{
    activity_type: string;
    id: string;
    tweet_id: string;
    market_created_at: Date;
    supply: number;
    buy_price: number;
    price_change: number;
    media_id: string;
    platform: string;
    media_author_id: string;
    image_url: string;
    media_created_at: Date;
    media_name: string;
    name: string | null;
    username: string | null;
    twitter_id: string | null;
    image: string | null;
    author_username: string;
    activity_created_at: Date;
  }[]>(query, limit);

  // Transform the raw results into the Activity type
  return results.map((result) => ({
    activityType: result.activity_type as ActivityType,
    market: {
      id: result.id,
      tweetId: result.tweet_id,
      createdAt: result.market_created_at,
      supply: result.supply,
      buyPrice: Number(result.buy_price),
      priceChange24h: Number(result.price_change),
      authorUsername: result.author_username,
      media: {
        id: result.media_id,
        platform: result.platform,
        authorId: result.media_author_id,
        imageUrl: result.image_url,
        createdAt: result.media_created_at,
        name: result.media_name,
      },
    },
    user: {
      name: result.name,
      username: result.username,
      twitterId: result.twitter_id,
      image: result.image,
    },
    createdAt: result.activity_created_at,
  }));
}

async function getFollowingActivities(limit: number = 20): Promise<Activity[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  // Single query to get IDs of followed users
  const followingIds = await prisma.userProfile
    .findUnique({
      where: { id: currentUser.id },
      select: {
        following: {
          select: {
            followingId: true,
          },
        },
      },
    })
    .then(
      (result) => result?.following.map((follow) => follow.followingId) || []
    );

  if (!followingIds.length) return [];

  const query = `
    WITH combined_activities AS (
    (
      -- Trades
      SELECT 
        CASE 
          WHEN t.type = 'BUY' THEN 'MINT'
          ELSE 'BURN'
        END as activity_type,
        m.id,
        m."tweetId" as tweet_id,
        m."createdAt" as market_created_at,
        m.supply,
        m."buyPrice" as buy_price,
        med.id as media_id,
        med.platform,
        med."authorId" as media_author_id,
        med."imageUrl" as image_url,
        med."createdAt" as media_created_at,
        med.name as media_name,
        uTrader.name as name,
        uTrader.username as username,
        uTrader."twitterId" as twitter_id,
        uTrader.image as image,
        uAuthor.username as author_username,
        t."createdAt" as activity_created_at
      FROM "public"."Trade" t
      JOIN "public"."Market" m ON t."marketId" = m.id
      JOIN "public"."Media" med ON m."mediaId" = med.id
      JOIN "public"."UserProfile" uTrader ON t."userId" = uTrader.id
      JOIN "public"."UserProfile" uAuthor ON m."authorId" = uAuthor.id
      WHERE t.id IN (
        SELECT DISTINCT ON ("txId") id 
        FROM "public"."Trade" 
        ORDER BY "txId", "createdAt" DESC
      )
      AND t."userId" = ANY($2::uuid[])
      ORDER BY t."createdAt" DESC
      LIMIT $1
  )  

      UNION ALL
      (
      -- Launches
      SELECT 
        'LAUNCH' as activity_type,
        m.id,
        m."tweetId" as tweet_id,
        m."createdAt" as market_created_at,
        m.supply,
        m."buyPrice" as buy_price,
        med.id as media_id,
        med.platform,
        med."authorId" as media_author_id,
        med."imageUrl" as image_url,
        med."createdAt" as media_created_at,
        med.name as media_name,
        uCurator.name as name,
        uCurator.username as username,
        uCurator."twitterId" as twitter_id,
        uCurator.image as image,
        uAuthor.username as author_username,
        m."createdAt" as activity_created_at
      FROM "public"."Market" m
      JOIN "public"."Media" med ON m."mediaId" = med.id
      JOIN "public"."UserProfile" uCurator ON m."curatorId" = uCurator.id
      JOIN "public"."UserProfile" uAuthor ON m."authorId" = uAuthor.id
      WHERE m."curatorId" IS NOT NULL
      AND m."curatorId" = ANY($2::uuid[])
      ORDER BY m."createdAt" DESC
      LIMIT $1
  )
    ),
    market_ids AS (
      SELECT DISTINCT id
      FROM combined_activities
    ),
    old_prices AS (
      SELECT
        m.id as "marketId",
        COALESCE(MAX(t.price), 0.00003125) as old_price
      FROM "Market" m
      LEFT JOIN "Trade" t ON t."marketId" = m.id AND t."createdAt" < NOW() - INTERVAL '24 HOURS'
      WHERE m.id IN (SELECT id FROM market_ids)
      GROUP BY m.id
    ),
    combined_activities_with_price_change AS (
      SELECT
        ca.*,
        (ca.buy_price - op.old_price) / op.old_price * 100 as price_change
      FROM combined_activities ca
      LEFT JOIN old_prices op ON ca.id = op."marketId"
    )
    SELECT *
    FROM combined_activities_with_price_change
    ORDER BY activity_created_at DESC
    LIMIT $1;
  
    `;

  const results = await prisma.$queryRawUnsafe<{
    activity_type: string;
    id: string;
    tweet_id: string;
    market_created_at: Date;
    supply: number;
    buy_price: number;
    price_change: number;
    media_id: string;
    platform: string;
    media_author_id: string;
    image_url: string;
    media_created_at: Date;
    media_name: string;
    name: string | null;
    username: string | null;
    twitter_id: string | null;
    image: string | null;
    author_username: string;
    activity_created_at: Date;
  }[]>(query, limit, followingIds);

  // Transform the raw results into the Activity type
  return results.map((result) => ({
    activityType: result.activity_type as ActivityType,
    market: {
      id: result.id,
      tweetId: result.tweet_id,
      createdAt: result.market_created_at,
      supply: result.supply,
      buyPrice: Number(result.buy_price),
      priceChange24h: Number(result.price_change),
      authorUsername: result.author_username,
      media: {
        id: result.media_id,
        platform: result.platform,
        authorId: result.media_author_id,
        imageUrl: result.image_url,
        createdAt: result.media_created_at,
        name: result.media_name,
      },
    },
    user: {
      name: result.name,
      username: result.username,
      twitterId: result.twitter_id,
      image: result.image,
    },
    createdAt: result.activity_created_at,
  }));
}

export { getFollowingActivities, getGlobalActivities };
