import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Position } from "@prisma/client";

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
      },
    });
    return market;
  });
