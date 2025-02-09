import { protectedProcedure } from "../../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const updateUsername = protectedProcedure
  .input(
    z.object({
      walletAddress: z.string(),
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

    try {
      const existingUser = await ctx.db.user.findFirst({
        where: {
          wallets: {
            some: {
              address: input.walletAddress,
            },
          },
        },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: existingUser.id },
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

export const updateImage = protectedProcedure
  .input(
    z.object({
      walletAddress: z.string(),
      image: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { image } = input;

    try {
      const existingUser = await ctx.db.user.findFirst({
        where: {
          wallets: {
            some: {
              address: input.walletAddress,
            },
          },
        },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: existingUser.id },
        data: { image },
      });
      return updatedUser;
    } catch (error: unknown) {
      throw error;
    }
  });
