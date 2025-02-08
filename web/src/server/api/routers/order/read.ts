import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { OrderStatus, Position } from "@prisma/client";

export const readOrder = protectedProcedure
  .input(
    z.object({
      orderId: z.string(),
    })
  )
  .query(async ({ input }) => {
    const order = await db.order.findUnique({
      where: {
        id: input.orderId,
      },
      include: {
        baseMint: true,
        user: true,
        market: true,
      },
    });
    return order;
  });

export const readOrdersForMarket = protectedProcedure
  .input(
    z.object({
      marketAddress: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const orders = await db.order.findMany({
      where: {
        market: {
          address: input.marketAddress,
        },
      },
      include: {
        user: true,
        market: true,
        baseMint: true,
      },
    });
    return orders;
  });

export const readOrdersForUserByMarket = protectedProcedure
  .input(
    z.object({
      marketAddress: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const orders = await db.order.findMany({
      where: {
        userId: userId,
        market: {
          address: input.marketAddress,
        },
      },
    });
    return orders;
  });

export const getLastOrderIdForUser = protectedProcedure
  .input(
    z.object({
      marketAddress: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const order = await db.order.findFirst({
      where: {
        userId: userId,
      },
      orderBy: {
        clientOrderId: "desc",
      },
    });
    return order?.clientOrderId ?? 0;
  });
