import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthOptions } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { capsuleServer } from "../capsule";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  debug: true,
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      const dbuser = await db.user.findUnique({
        where: { id: token.userId as string },
      });
      const email = dbuser?.email;
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.email = email as string;
      }
      return session;
    },
    signIn: async ({ user }: { user: any }) => {
      return true;
    },
  },
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      id: "capsule",
      name: "Capsule",
      credentials: {
        email: { label: "Email", type: "text" },
        capsuleUserId: { label: "Capsule User ID", type: "text" },
        publicKey: { label: "Public Key", type: "text" },
        serializedSession: { label: "Serialized Session", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) {
            throw new Error("No credentials provided");
          }
          if (credentials.capsuleUserId) {
            console.log("A");
            capsuleServer.importSession(
              credentials.serializedSession as string
            );
            let user = await db.user.findUnique({
              where: { capsuleUserId: credentials.capsuleUserId as string },
            });

            if (!user) {
              console.log("B");

              if (credentials.email) {
                console.log("C");
                user = await db.user.create({
                  data: {
                    capsuleUserId: credentials.capsuleUserId as string,
                    email: credentials.email as string,
                  },
                });
              } else {
                console.log("D");
                user = await db.user.create({
                  data: {
                    capsuleUserId: credentials.capsuleUserId as string,
                  },
                });
              }
            }

            if (user && !user.email && credentials.email) {
              console.log("E");
              await db.user.update({
                where: { id: user.id },
                data: {
                  email: credentials.email as string,
                },
              });
            }

            const wallets = await db.wallet.findMany({
              where: {
                userId: user.id,
              },
            });
            const walletAddresses = wallets.map((wallet) => wallet.address);
            if (
              walletAddresses.length === 0 ||
              !walletAddresses.includes(credentials.publicKey as string)
            ) {
              console.log("F");
              const wallet = await db.wallet.create({
                data: {
                  address: credentials.publicKey as string,
                  userId: user.id,
                },
              });
              await db.user.update({
                where: { id: user.id },
                data: {
                  wallets: {
                    connect: {
                      id: wallet.id,
                    },
                  },
                },
              });
            }

            return user;
          } else if (credentials.publicKey) {
            console.log("G");
            const wallet = await db.wallet.findUnique({
              where: {
                address: credentials.publicKey as string,
              },
              include: {
                user: true,
              },
            });
            if (wallet?.user) {
              console.log("H");
              return wallet.user;
            }
            console.log("I");
            const newWallet = await db.wallet.create({
              data: {
                address: credentials.publicKey as string,
                user: {
                  create: {},
                },
              },
            });
            const walletWithUser = await db.wallet.findUnique({
              where: {
                id: newWallet.id,
              },
              include: {
                user: true,
              },
            });
            await db.user.update({
              where: { id: walletWithUser?.user?.id },
              data: {
                wallets: {
                  connect: {
                    id: newWallet.id,
                  },
                },
              },
            });
            if (walletWithUser?.user) {
              return walletWithUser?.user;
            }
            return null;
          }
          return null;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  // Add a custom page that will handle the Capsule modal
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt", // Use JWT strategy for sessions
  },
} satisfies NextAuthOptions;
