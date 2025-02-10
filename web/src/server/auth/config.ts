import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthOptions } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { paraServer } from "../para";
import { PublicKey } from "@solana/web3.js";

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
      wallets: string[];
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
        include: {
          wallets: true,
        },
      });
      const email = dbuser?.email;
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.email = email as string;
        session.user.wallets = dbuser?.wallets.map((wallet) => wallet.address);
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
      id: "para",
      name: "Para",
      credentials: {
        email: { label: "Email", type: "text" },
        paraUserId: { label: "Para User ID", type: "text" },
        publicKey: { label: "Public Key", type: "text" },
        serializedSession: { label: "Serialized Session", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) {
            throw new Error("No credentials provided");
          }
          console.log("Credentials", credentials);
          if (credentials.paraUserId !== "undefined") {
            paraServer.importSession(credentials.serializedSession as string);

            const wallet = await db.wallet.findFirst({
              where: {
                address: credentials.publicKey as string,
              },
              include: {
                user: true,
              },
            });

            if (wallet?.user?.paraUserId === credentials.paraUserId) {
              return wallet.user;
            }
            if (wallet?.user) {
              await db.user.update({
                where: { id: wallet.user.id },
                data: {
                  paraUserId: credentials.paraUserId as string,
                },
              });
              return wallet.user;
            } else {
              if (credentials.email && credentials.email !== "undefined") {
                const user = await db.user.create({
                  data: {
                    paraUserId: credentials.paraUserId as string,
                    email: credentials.email as string,
                  },
                });
                await db.wallet.create({
                  data: {
                    address: credentials.publicKey as string,
                    userId: user.id,
                  },
                });
                return user;
              } else {
                const user = await db.user.create({
                  data: {
                    paraUserId: credentials.paraUserId as string,
                  },
                });
                await db.wallet.create({
                  data: {
                    address: credentials.publicKey as string,
                    userId: user.id,
                  },
                });
                return user;
              }
            }
          } else if (credentials.publicKey) {
            try {
              const pk = new PublicKey(credentials.publicKey as string);
            } catch (error) {
              console.error("Invalid public key", error);
              return null;
            }
            const wallet = await db.wallet.findUnique({
              where: {
                address: credentials.publicKey as string,
              },
              include: {
                user: true,
              },
            });
            if (wallet?.user) {
              return wallet.user;
            }
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
    CredentialsProvider({
      id: "wallet",
      name: "Wallet",
      credentials: {
        publicKey: { label: "Public Key", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) {
            throw new Error("No credentials provided");
          }
          console.log("Credentials", credentials);
          if (credentials.publicKey) {
            try {
              const pk = new PublicKey(credentials.publicKey as string);
            } catch (error) {
              console.error("Invalid public key", error);
              return null;
            }
            const wallet = await db.wallet.findUnique({
              where: {
                address: credentials.publicKey as string,
              },
              include: {
                user: true,
              },
            });
            if (wallet?.user) {
              return wallet.user;
            }
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
            console.log("walletWithUser", walletWithUser);
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
  // Add a custom page that will handle the Para modal
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt", // Use JWT strategy for sessions
  },
} satisfies NextAuthOptions;
