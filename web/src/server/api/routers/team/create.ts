import { db } from "@/server/db";
import { protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const createTeam = protectedProcedure
  .input(
    z.object({
      teamName: z.string(),
      teamImage: z.string(),
      teamSportsdataId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const team = await db.team.create({
      data: {
        name: input.teamName,
        image: input.teamImage,
        sportsDataId: input.teamSportsdataId,
      },
    });
    return team;
  });
