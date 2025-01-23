import { createTRPCRouter } from "@/server/api/trpc";
import { createTeam } from "./create";

export const teamRouter = createTRPCRouter({
  create: createTeam,
});
