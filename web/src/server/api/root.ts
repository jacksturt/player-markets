// import { counterRouter } from "@/server/api/routers/counter";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { marketRouter } from "./routers/market";
import { mintRouter } from "./routers/mint";
import { teamRouter } from "./routers/team";
import { tradeRouter } from "./routers/trade";
import { orderRouter } from "./routers/order";
import { playsRouter } from "./routers/plays";
import { userRouter } from "./routers/user";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  market: marketRouter,
  mint: mintRouter,
  team: teamRouter,
  trade: tradeRouter,
  order: orderRouter,
  plays: playsRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
