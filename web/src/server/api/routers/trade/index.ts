import { createTRPCRouter } from "@/server/api/trpc";
import { readTradesForMarket, readMyTrades } from "./read";
export const tradeRouter = createTRPCRouter({
  readForMarket: readTradesForMarket,
  readMyTrades: readMyTrades,
});
