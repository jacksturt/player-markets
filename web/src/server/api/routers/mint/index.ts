import { createTRPCRouter } from "@/server/api/trpc";
import { createMint } from "./create";

export const mintRouter = createTRPCRouter({
  create: createMint,
});
