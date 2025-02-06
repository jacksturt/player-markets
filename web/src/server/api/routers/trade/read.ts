import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Position } from "@prisma/client";

export const readTradesForMarket = protectedProcedure
  .input(
    z.object({
      marketAddress: z.string(),
    })
  )
  .query(async ({ input }) => {
    const trades = await db.trade.findMany({
      where: {
        market: {
          address: input.marketAddress,
        },
      },
      include: {
        baseMint: true,
        buyer: true,
        buyerWallet: true,
        seller: true,
        sellerWallet: true,
      },
    });
    return trades;
  });
