"use server";
import prisma from "../db";
import { getServerUser } from "@/server/user";

async function storeUserWallet(userPubKey: string) {
  const userId = (await getServerUser())?.id || null;
  if (!userId) {
    throw new Error("Error getting user, server side")
  };
  await prisma.wallet.upsert({
    where: {
      userId: userId,
      publicKey: userPubKey
    },
    create: {
      userId: userId,
      publicKey: userPubKey,
    },
    update: {},
  });
}

export { storeUserWallet };