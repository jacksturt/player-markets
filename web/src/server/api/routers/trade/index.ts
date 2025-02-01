import { createTRPCRouter } from "@/server/api/trpc";
import { readTradesForMarket } from "./read";
export const tradeRouter = createTRPCRouter({
  readForMarket: readTradesForMarket,
});
