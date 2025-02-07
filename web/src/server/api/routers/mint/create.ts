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
      return mint;
    }
  });
