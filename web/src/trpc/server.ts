// utils/server-trpc.ts
import { appRouter } from "@/server/api/root";
import { createCallerFactory, createTRPCContext } from "@/server/api/trpc";

// Create a caller factory from your app router
const createCaller = createCallerFactory(appRouter);

// Function to create an authenticated caller with optional session
export async function createServerCaller(session?: any) {
  // Create context with session if provided
  const context = await createTRPCContext({
    headers: new Headers(),
  });

  // Create and return caller with context
  return createCaller(context);
}
