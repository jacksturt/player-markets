import Navbar from "@/components/shared/navbar";
import LeaderboardView from "@/components/leaderboard/leaderboard-view";

export default async function LeaderboardPage() {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col gap-5 bg-gradient-to-b from-[#1E1E1E] via-[#050505] to-black text-white pt-[22px]">
      <Navbar />
      <LeaderboardView />
    </div>
  );
}
