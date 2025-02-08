import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Position } from "@prisma/client";

export const createMint = protectedProcedure
  .input(
    z.object({
      mintName: z.optional(z.string()),
      mintSymbol: z.optional(z.string()),
      mintImage: z.optional(z.string()),
      mintSlug: z.string(),
      timestamp: z.string(),
      teamImage: z.optional(z.string()),
      playerImage: z.optional(z.string()),
      description: z.string(),
      baseMint: z.string(),
      position: z.optional(z.nativeEnum(Position)),
      teamId: z.optional(z.string()),
      playerName: z.optional(z.string()),
      playerSportsdataId: z.optional(z.number()),
      teamName: z.optional(z.string()),
      teamSportsdataId: z.optional(z.string()),
      projectedPoints: z.number(),
      network: z.enum(["MAINNET", "DEVNET"]),
      season: z.string(),
      week: z.string(),
      marketName: z.string(),
      address: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    if (input.teamId) {
      const mint = await db.mint.create({
        data: {
          address: input.baseMint,
          name: input.mintName!,
          symbol: input.mintSymbol!,
          image: input.mintName!,
          description: input.description,
          decimals: 6,
          timestamp: input.timestamp,
          mintSlug: input.mintSlug,
        },
      });
      const player = await db.player.create({
        data: {
          name: input.playerName!,
          teamId: input.teamId,
          position: input.position!,
          image: input.playerImage!,
          sportsDataId: input.playerSportsdataId!,
          mint: {
            connect: {
              id: mint.id,
            },
          },
        },
      });
      const market = await db.market.create({
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
          player: {
            connect: {
              id: player.id,
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
          id: player.id,
        },
        data: {
          marketId: market.id,
          mintId: mint.id,
        },
      });

      return mint;
    } else {
      let team = await db.team.findUniqueOrThrow({
        where: {
          sportsDataId: input.teamSportsdataId!,
        },
      });

      const mint = await db.mint.create({
        data: {
          address: input.baseMint,
          name: team.name,
          symbol: team.sportsDataId,
          image: team.image,
          description: team.name,
          decimals: 6,
          timestamp: input.timestamp,
          mintSlug: input.mintSlug,
        },
      });

      await db.team.update({
        where: {
          id: team.id,
        },
        data: {
          mint: {
            connect: {
              id: mint.id,
            },
          },
        },
      });
      const market = await db.market.create({
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
              id: team.id,
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
          id: team.id,
        },
        data: {
          marketId: market.id,
          mintId: mint.id,
          stats: {
            create: {
              actualPoints: 0,
              projectedPoints: input.projectedPoints,
            },
          },
        },
      });
      return mint;
    }
  });
