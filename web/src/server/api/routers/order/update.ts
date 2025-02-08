import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const cancelOrderForMarketByUser = protectedProcedure
  .input(
    z.object({
      marketAddress: z.string(),
      orderSequenceNumber: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const order = await db.order.update({
      where: {
        marketId_sequenceNumber_userId: {
          marketId: input.marketAddress,
          sequenceNumber: input.orderSequenceNumber,
          userId: userId,
        },
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });
  });

export const cancelAllOrdersForMarketByUser = protectedProcedure
  .input(
    z.object({
      marketAddress: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const orders = await db.order.updateMany({
      where: {
        marketId: input.marketAddress,
        userId: userId,
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });
  });
