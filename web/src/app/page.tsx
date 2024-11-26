import LeaderboardGatedContent from "./gating";
import { getCollectors, getCreators } from "@/server/leaderboard";
import { getCurrentUser } from "@/server/user";

async function Leaderboard() {
  const user = await getCurrentUser();
  const creators = await getCreators();
  const collectors = await getCollectors();

  return (
    <LeaderboardGatedContent
      user={user}
      creators={creators}
      collectors={collectors}
    />
  );
}

export default Leaderboard;