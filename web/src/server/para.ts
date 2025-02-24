// Server-side route
import { Para as ParaServer, Environment } from "@getpara/server-sdk";

export const paraServer = new ParaServer(
  Environment.BETA,
  process.env.NEXT_PUBLIC_PARA_API_KEY_BETA
);
