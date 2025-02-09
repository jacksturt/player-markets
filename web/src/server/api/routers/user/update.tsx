import { protectedProcedure } from "../../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const updateUsername = protectedProcedure
  .input(
    z.object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be less than 30 characters")
        .regex(
          /^[a-zA-Z0-9_-]+$/,
          "Username can only contain letters, numbers, underscores, and hyphens"
        ),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { username } = input;
    const { session } = ctx;
    const userId = session.user.id;

    try {
      const updatedUser = await ctx.db.user.update({
        where: { id: userId },
        data: { username },
      });
      return updatedUser;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This username is already taken",
        });
      }
      throw error;
    }
  });
