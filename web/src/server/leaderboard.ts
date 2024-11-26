"use server";
import prisma from "@/lib/db";
import { Creator, Collector, CreatorRaw } from "@/types/table";
import { FetchedMarkets } from "@/types/queries";
import Decimal from "decimal.js";
import { raw } from "@prisma/client/runtime/library";

async function getMarkets(
  sortBy: "price" | "priceChange24h" | "time" | "volume",
  order: "asc" | "desc"
): Promise<FetchedMarkets[]> {
  "use server";
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Build the ORDER BY clause dynamically
    const orderByClause = {
      price: `m."buyPrice" ${order}`,
      priceChange24h: `
        CASE 
          WHEN op.old_price IS NOT NULL AND op.old_price > 0
          THEN ((m."buyPrice" - op.old_price) / op.old_price * 100)
          ELSE NULL
        END ${order} NULLS LAST`,
      time: `m."createdAt" ${order}`,
      volume: `COALESCE(mv.volume_24h, 0) ${order}`
    }[sortBy];

    const markets = await prisma.$queryRaw<FetchedMarkets[]>`
      WITH MarketVolume AS (
        SELECT 
          "marketId",
          SUM(price) as volume_24h
        FROM "Trade"
        WHERE "createdAt" >= ${twentyFourHoursAgo}
        GROUP BY "marketId"
      ),
      OldPrices AS (
        SELECT DISTINCT ON (m.id)
          m.id as "marketId",
          COALESCE(t.price, 0.00003125) as old_price
        FROM "Market" m
        LEFT JOIN "Trade" t ON t."marketId" = m.id AND t."createdAt" < ${twentyFourHoursAgo}
        ORDER BY m.id, t."createdAt" DESC, t."incrementId" DESC
      )
      SELECT 
        m.id,
        m."createdAt",
        m."mediaId",
        m."tweetId",
        m.supply,
        m."buyPrice"::float as "buyPrice",
        m."sellPrice"::float as "sellPrice",
        m."marketCap"::float as "marketCap",
        m."authorVaultPublicKey",
        m.signature,
        CASE 
          WHEN op.old_price IS NOT NULL AND op.old_price > 0
          THEN ((m."buyPrice" - op.old_price) / op.old_price * 100)::float
          ELSE NULL
        END as "priceChange24h",
        json_build_object(
          'id', med.id,
          'platform', med.platform,
          'imageUrl', med."imageUrl"
        ) as media,
        COALESCE(mv.volume_24h, 0)::float as volume_24h
      FROM "Market" m
      LEFT JOIN MarketVolume mv ON mv."marketId" = m.id
      LEFT JOIN OldPrices op ON op."marketId" = m.id
      LEFT JOIN "Media" med ON med.id = m."mediaId"
      ORDER BY ${raw(orderByClause)}
      LIMIT 50
    `;

    return markets;
  } catch (error) {
    console.error("Error fetching markets:", error);
    throw error;
  }
}

function getOrderByClause(sortBy: "price" | "priceChange24h" | "time" | "volume", order: "asc" | "desc") {
  switch (sortBy) {
    case "price":
      return { buyPrice: order };
    case "priceChange24h":
      return { buyPrice: order };
    case "time":
      return { createdAt: order };
    case "volume":
      return { trades: { _sum: { price: order } } };
  }
}

async function getCreators(): Promise<Creator[]> {
  "use server";

  const topCreatorsRaw: CreatorRaw[] = await prisma.$queryRaw`
    WITH TradeVolume AS (
    SELECT
        t."authorId" as tradeAuthorId,
        SUM(t."price") AS totalVolume24h
    FROM
        public."Trade" t
    WHERE
        t."createdAt" >= NOW() - INTERVAL '24 HOURS'
    GROUP BY
        t."authorId"
    ),
    Holders AS (
        SELECT
            b."authorId" as bangerAuthorId,
            COUNT(DISTINCT b."ownerId") AS holders
        FROM
            public."Banger" b
        WHERE
            b."hasBeenBurned" = FALSE
        GROUP BY
            b."authorId"
    )

    SELECT
        u.id,
        u.image,
        u.username,
        COALESCE(SUM(m."marketCap"), 0) as marketCap,
        JSON_BUILD_OBJECT('total', COALESCE(tv.totalVolume24h, 0), 'hours', 24) as volume,
        COALESCE(h.holders, 0) as holders
    FROM
        public."UserProfile" u
    LEFT JOIN
        public."Market" m ON m."authorId" = u.id
    LEFT JOIN
        TradeVolume tv ON tv.tradeAuthorId = u.id
    LEFT JOIN
        Holders h ON h.bangerAuthorId = u.id
    GROUP BY
        u.id, tv.totalVolume24h, h.holders
    ORDER BY
        marketCap DESC
    LIMIT 50;
  `;

  // Convert Decimal objects to plain numbers
  const creators: Creator[] = topCreatorsRaw.map((creator) => ({
    image: creator.image,
    username: creator.username,
    marketCap: Number(Number(creator.marketcap).toFixed(2)),
    volume: {
      total: Number(Number(creator.volume.total).toFixed(2)),
      hours: creator.volume.hours,
    },
    holders: Number(Number(creator.holders).toFixed(2)),
  }));
  return creators;
}

async function getCollectors(): Promise<Collector[]> {
  "use server";

  const topCollectorsRaw: any[] = await prisma.$queryRaw`
    WITH TradeVolume AS (
      SELECT
          t."userId" as collectorUserId,
          SUM(t."price") AS totalVolume24h
      FROM
          public."Trade" t
      WHERE
          t."createdAt" >= NOW() - INTERVAL '24 HOURS'
      GROUP BY
          t."userId"
    ),
    BangerCount AS (
      SELECT
          b."ownerId" as collectorUserId,
          COUNT(b."id") AS bangers
      FROM
          public."Banger" b
      WHERE
          b."hasBeenBurned" = FALSE
      GROUP BY
          b."ownerId"
    ),
    BangerMarketCount AS (
      SELECT
          bo."ownerId" as collectorUserId,
          bo."marketId",
          COUNT(bo."id") AS marketBangerCount
      FROM
          public."Banger" bo
      WHERE
          bo."hasBeenBurned" = FALSE
      GROUP BY
          bo."ownerId", bo."marketId"
    ),
    NetWorth AS (
      SELECT
        bmc.collectorUserId,
        SUM(bmc.marketBangerCount * m."buyPrice") AS netWorth
      FROM
        BangerMarketCount bmc
      JOIN
        public."Market" m ON bmc."marketId" = m."id"
      GROUP BY
        bmc.collectorUserId
    )
    SELECT
        u.id,
        u.username,
        u.image,
        nw.netWorth,
        JSON_BUILD_OBJECT('total', COALESCE(tv.totalVolume24h, 0), 'hours', 24) as volume,
        bc.bangers
    FROM
        public."UserProfile" u
    JOIN
        NetWorth nw ON nw.collectorUserId = u.id
    LEFT JOIN
        TradeVolume tv ON tv.collectorUserId = u.id
    JOIN
        BangerCount bc ON bc.collectorUserId = u.id
    ORDER BY
        nw.netWorth DESC
    LIMIT 50;
  `;

  // Convert Decimal objects to plain numbers
  const collectors: Collector[] = topCollectorsRaw.map((collector) => ({
    image: collector.image,
    username: collector.username,
    netWorth: Number(Number(collector.networth).toFixed(2)),
    volume: {
      total: Number(Number(collector.volume.total).toFixed(2)),
      hours: collector.volume.hours,
    },
    bangers: Number(Number(collector.bangers).toFixed(2)),
  }));
  return collectors;
}

export { getCreators, getCollectors, getMarkets };
