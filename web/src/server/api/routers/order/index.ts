import { createTRPCRouter } from "@/server/api/trpc";
import { createOrder } from "./create";
import {
  readOrder,
  getLastOrderIdForUser,
  readOrdersForUserByMarket,
  readOrdersForMarket,
} from "./read";
export const orderRouter = createTRPCRouter({
  create: createOrder,
  read: readOrder,
  getLastOrderIdForUser: getLastOrderIdForUser,
  readOrdersForUserByMarket: readOrdersForUserByMarket,
  readOrdersForMarket: readOrdersForMarket,
});
