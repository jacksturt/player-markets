import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { OrderType, Position } from "@prisma/client";

export const createOrder = protectedProcedure
  .input(
    z.object({
      marketAddress: z.string(),
      price: z.number(),
      isBid: z.boolean(),
      numBaseTokens: z.number(),
      numQuoteTokens: z.number(),
      signature: z.string(),
      clientOrderId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const market = await db.market.findUnique({
      where: {
        address: input.marketAddress,
      },
    });
    const userId = ctx.session.user.id;
    if (!market) {
      throw new Error("Market not found");
    }
    const order = await db.order.create({
      data: {
        type: OrderType.LIMIT,
        price: input.price,
        isBid: input.isBid,
        numBaseTokens: input.numBaseTokens,
        numQuoteTokens: input.numBaseTokens * input.price,
        clientOrderId: input.clientOrderId,
        signature: input.signature,
        baseMint: {
          connect: {
            id: market?.baseMintId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
        market: {
          connect: {
            id: market?.id,
          },
        },
      },
    });
  });
