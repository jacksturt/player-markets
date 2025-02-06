import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Position } from "@prisma/client";

export const createMint = protectedProcedure
  .input(
    z.object({
      mintName: z.string(),
      mintSymbol: z.string(),
      mintImage: z.string(),
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
    const mint = await db.mint.create({
      data: {
        address: input.baseMint,
        name: input.mintName,
        symbol: input.mintSymbol,
        image: input.mintName,
        description: input.description,
        decimals: 6,
        timestamp: input.timestamp,
        mintSlug: input.mintSlug,
      },
    });
    if (input.teamId) {
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
    } else {
      let team = await db.team.findUnique({
        where: {
          sportsDataId: input.teamSportsdataId!,
        },
      });
      if (!team) {
        team = await db.team.create({
          data: {
            name: input.teamName!,
            image: input.teamImage!,
            sportsDataId: input.teamSportsdataId!,
            mint: {
              connect: {
                id: mint.id,
              },
            },
          },
        });
      } else {
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
      }
    }
    return mint;
  });
