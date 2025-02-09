import { db } from "@/server/db";
import { protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const readUser = protectedProcedure
  .input(
    z.object({
      walletAddress: z.string(),
    })
  )
  .query(async ({ input }) => {
    const user = await db.user.findFirst({
      where: {
        wallets: {
          some: {
            address: input.walletAddress,
          },
        },
      },
    });
    return user;
  });
