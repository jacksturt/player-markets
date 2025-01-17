import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Position } from "@prisma/client";

export const createMarket = protectedProcedure
  .input(
    z.object({
      marketName: z.string(),
      description: z.string(),
      address: z.string(),
      mintAddress: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const mint = await db.mint.findUnique({
      where: {
        address: input.mintAddress,
      },
    });
    if (!mint) {
      throw new Error("Mint not found");
    }
    let market;
    if (mint?.playerId) {
      const market = await db.market.create({
        data: {
          name: input.marketName,
          description: input.description,
          address: input.address,
          baseMint: {
            connect: {
              id: mint.id,
            },
          },
          player: {
            connect: {
              id: mint.playerId,
            },
          },
        },
      });
    } else if (mint?.teamId) {
      market = await db.market.create({
        data: {
          name: input.marketName,
          description: input.description,
          address: input.address,
          baseMint: {
            connect: {
              id: mint.id,
            },
          },
          team: {
            connect: {
              id: mint.teamId,
            },
          },
        },
      });
    }

    return market;
  });
