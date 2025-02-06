import { createTRPCRouter } from "@/server/api/trpc";
import { createMarket } from "./create";
import { readMarket, lastTradePrice, readAllMarkets } from "./read";
export const marketRouter = createTRPCRouter({
  create: createMarket,
  read: readMarket,
  readAllMarkets: readAllMarkets,
  lastTradePrice: lastTradePrice,
});
