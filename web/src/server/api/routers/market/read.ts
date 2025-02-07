import { db } from "@/server/db";
import { protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const readMarket = protectedProcedure
  .input(
    z.object({
      marketAddress: z.string(),
    })
  )
  .query(async ({ input }) => {
    const market = await db.market.findUnique({
      where: {
        address: input.marketAddress,
      },
      include: {
        baseMint: true,
        player: {
          include: {
            team: true,
            projections: true,
          },
        },
        team: true,
      },
    });
    return market;
  });

export const readAllMarkets = protectedProcedure.query(async () => {
  const markets = await db.market.findMany({
    include: {
      baseMint: true,
      player: true,
      team: true,
    },
  });
  return markets;
});

export const lastTradePrice = protectedProcedure
  .input(
    z.object({
      marketAddress: z.string(),
    })
  )
  .query(async ({ input }) => {
    const market = await db.market.findUniqueOrThrow({
      where: {
        address: input.marketAddress,
      },
      select: {
        lastTradePrice: true,
      },
    });
    return market.lastTradePrice?.toNumber() ?? null;
  });
