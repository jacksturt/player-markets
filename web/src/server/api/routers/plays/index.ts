import { createTRPCRouter } from "@/server/api/trpc";
import { latestPlay, playsByTeam, playsByPlayer } from "./read";
export const playsRouter = createTRPCRouter({
  latestPlay: latestPlay,
  playsByTeam: playsByTeam,
  playsByPlayer: playsByPlayer,
});
