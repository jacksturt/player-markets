import NextAuth from "next-auth";

import { authConfig } from "@/server/auth/config";

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };

export function getServerSideProps(context: any) {
  console.log("Query params:", context.query);
  return { props: {} };
}
