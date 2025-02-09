import { createTRPCRouter } from "@/server/api/trpc";
import { createOrder } from "./create";
import {
  readOrder,
  getLastOrderIdForUser,
  readOrdersForUserByMarket,
  readOrdersForMarket,
  getAllMyOpenOrders,
  readOpenOrdersForMarket,
} from "./read";
import {
  cancelAllOrdersForMarketByUser,
  cancelOrderForMarketByUser,
  cancelOrderById,
} from "./update";
export const orderRouter = createTRPCRouter({
  create: createOrder,
  read: readOrder,
  getLastOrderIdForUser: getLastOrderIdForUser,
  readOrdersForUserByMarket: readOrdersForUserByMarket,
  readOrdersForMarket: readOrdersForMarket,
  readOpenOrdersForMarket: readOpenOrdersForMarket,
  cancelOrderForMarketByUser: cancelOrderForMarketByUser,
  cancelAllOrdersForMarketByUser: cancelAllOrdersForMarketByUser,
  getAllMyOpenOrders: getAllMyOpenOrders,
  cancelOrderById: cancelOrderById,
});
