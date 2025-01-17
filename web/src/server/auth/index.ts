import NextAuth, { getServerSession } from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);
const getServerAuthSession = () => getServerSession(authConfig);

export { auth, handlers, signIn, signOut, getServerAuthSession };
