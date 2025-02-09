import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { OrderStatus, Position } from "@prisma/client";

export const latestPlay = protectedProcedure.query(async () => {
  const plays = await db.play.findFirst({
    orderBy: {
      playId: "desc",
    },
  });
  return plays;
});

export const playsByTeam = protectedProcedure
  .input(z.string())
  .query(async ({ input }) => {
    const plays = await db.play.findMany({
      where: {
        teamId: input,
      },
    });
    return plays;
  });

export const playsByPlayer = protectedProcedure
  .input(z.string())
  .query(async ({ input }) => {
    const plays = await db.playStat.findMany({
      where: {
        playerId: input,
      },
      include: {
        play: true,
      },
    });
    return plays;
  });
