import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";

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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
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
    signIn: async ({ user }) => {
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
        userId: { label: "User ID", type: "text" },
        publicKey: { label: "Public Key", type: "text" },
        serializedSession: { label: "Serialized Session", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.userId) {
          throw new Error("No user ID provided");
        }
        console.log("importing session", credentials.serializedSession);
        capsuleServer.importSession(credentials.serializedSession as string);
        const users = await db.user.findMany();
        console.log("users", users.length);
        users.forEach((user) => {
          console.log("user", user.email);
        });
        try {
          const user = await db.user.upsert({
            where: { id: credentials.userId as string },
            update: {
              email: credentials.email as string,
            },
            create: {
              id: credentials.userId as string,
              email: credentials.email as string,
            },
          });

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
            await db.wallet.create({
              data: {
                address: credentials.publicKey as string,
                userId: user.id,
              },
            });
          }

          return user;
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
} satisfies NextAuthConfig;
