"use server";
import prisma from "@/lib/db";
import {
  getCurrentUser,
  createRedisUserIndex,
} from "@/server/user";

async function joinWithInvite(code: string) {
  const user = await getCurrentUser();
  if (!user) {
    console.error("No user found");
    return null;
  }

  await createRedisUserIndex(user);

  // Check if the invite code is valid and has uses remaining
  const invite = await prisma.invite.findUnique({
    where: {
      code: code,
      uses: { gt: 0 },
    },
  });
  if (!invite) return null;

  // Generate a profile secret for the user
  let secret;
  let isUnique = false;
  while (!isUnique) {
    secret = Math.floor(100000 + Math.random() * 900000).toString();
    const existingSecret = await prisma.userProfile.findFirst({
      where: {
        metadata: {
          path: ['secret'],
          equals: secret,
        },
      },
    });
    if (!existingSecret) {
      isUnique = true;
    }
  }

  // Connect the user to the invite
  await prisma.userProfile.update({
    where: {
      id: user.id,
    },
    data: {
      invite: {
        connect: {
          id: invite.id,
        },
      },
      metadata: {
        // alphaAccess: true,
        secret: secret,
      },
    },
  });

  // Add invite code for user
  await prisma.invite.create({
    data: {
      code: Math.floor(100000 + Math.random() * 999999).toString(),
      inviterId: user.id,
      uses: 3,
    }
  });

  // Decrement the uses
  const updateInvite = await prisma.invite.update({
    where: {
      code: code,
    },
    data: {
      uses: invite.uses - 1,
    }
  });
  return updateInvite;
}

async function createInvite(code: string, uses: number) {
  const user = await getCurrentUser();
  if (!user || user.twitterId !== "1433140607569088512") {
    console.error("Unauthorized");
    return null;
  }

  // Generate a random code if not provided
  const inviteCode = code || Math.floor(100000 + Math.random() * 999999).toString();

  const newInvite = await prisma.invite.create({
    data: {
      code: inviteCode,
      inviterId: user.id,
      uses: uses || 1,
    }
  });

  return newInvite;
}

async function allocateInvites(uses: number) {
  const user = await getCurrentUser();
  if (!user || user.twitterId !== "1433140607569088512") {
    console.error("Unauthorized");
    return null;
  }
  
  try {
    const updatedInvites = await prisma.invite.updateMany({
      where: {
        inviterId: {
          not: user.id
        }
      },
      data: {
        uses: uses
      }
    });

    return { updatedCount: updatedInvites.count };
  } catch (error) {
    console.error("Error allocating invites:", error);
    return null;
  }
}

async function changeCode(code: string) {
  const user = await getCurrentUser();
  try {
    const updatedInvites = await prisma.invite.updateMany({
      where: {
        inviterId: {
          equals: user!.id
        }
      },
      data: {
        code: code
      }
    });
  } catch (error) {
    console.error("Error changing code:", error);
    return null;
  }
  return code;
}

export { joinWithInvite, createInvite, allocateInvites, changeCode };