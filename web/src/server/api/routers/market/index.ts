import { createTRPCRouter } from "@/server/api/trpc";
import { createMarket } from "./create";
import { readMarket } from "./read";
export const marketRouter = createTRPCRouter({
  create: createMarket,
  read: readMarket,
});
