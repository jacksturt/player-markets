// Server-side route
import { Capsule as CapsuleServer, Environment } from "@usecapsule/server-sdk";

export const capsuleServer = new CapsuleServer(
  Environment.PROD,
  process.env.NEXT_PUBLIC_CAPSULE_API_KEY
);
