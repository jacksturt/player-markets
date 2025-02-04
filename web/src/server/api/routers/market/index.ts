import { createTRPCRouter } from "@/server/api/trpc";
import { createMarket } from "./create";
import { readMarket, lastTradePrice } from "./read";
export const marketRouter = createTRPCRouter({
  create: createMarket,
  read: readMarket,
  lastTradePrice: lastTradePrice,
});
