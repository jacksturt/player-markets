import { createTRPCRouter } from "@/server/api/trpc";
import { readTradesForMarket, readMyTrades, readBiggestTrades } from "./read";
export const tradeRouter = createTRPCRouter({
  readForMarket: readTradesForMarket,
  readMyTrades: readMyTrades,
  readBiggestTrades: readBiggestTrades,
});
