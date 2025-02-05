import { db } from "@/server/db";
import { protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const createMarket = protectedProcedure
  .input(
    z.object({
      marketName: z.string(),
      description: z.string(),
      address: z.string(),
      mintAddress: z.string(),
      network: z.enum(["MAINNET", "DEVNET"]),
      season: z.string(),
      week: z.string(),
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
          season: input.season,
          week: input.week,
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
      await db.mint.update({
        where: {
          id: mint.id,
        },
        data: {
          marketId: market.id,
        },
      });
      await db.player.update({
        where: {
          id: mint.playerId,
        },
        data: {
          marketId: market.id,
        },
      });
    } else if (mint?.teamId) {
      market = await db.market.create({
        data: {
          name: input.marketName,
          description: input.description,
          address: input.address,
          season: input.season,
          week: input.week,
          network: input.network,
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
      await db.mint.update({
        where: {
          id: mint.id,
        },
        data: {
          marketId: market.id,
        },
      });
      await db.team.update({
        where: {
          id: mint.teamId,
        },
        data: {
          marketId: market.id,
        },
      });
    }

    return market;
  });
