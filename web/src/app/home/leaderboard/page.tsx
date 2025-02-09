import Navbar from "@/components/shared/navbar";
import LeaderboardView from "@/components/leaderboard/leaderboard-view";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default async function LeaderboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push(`/auth/signin?callbackUrl=/home/leaderboard`);
    return null;
  }
  return (
    <div className="w-full min-h-screen overflow-y-auto flex flex-col flex-1 gap-5 bg-gradient-to-b from-[#1E1E1E] via-[#050505] to-black text-white pt-5">
      <Navbar />
      <LeaderboardView />
    </div>
  );
}
