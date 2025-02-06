import Navbar from "@/components/shared/navbar";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import TrendUp from "@/components/icons/trend-up";
import { cn } from "@/lib/utils";
import TrendDown from "@/components/icons/trend-down";

export default async function LeaderboardPage() {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col gap-5 bg-gradient-to-b from-[#1E1E1E] via-[#050505] to-black text-white pt-5">
      <Navbar />
      {/* two columns */}
      <div className="w-full h-full flex items-start gap-[70px] px-[120px] pt-8">
        {/* super MVP table UI, can upgrade to tanstack table later for more features */}
        <div className="w-full flex flex-col gap-[15px]">
          <p className="text-2xl text-white font-clashMed">Top 10 Traders</p>
          <div className="w-full flex flex-col">
            {/* TODO: leaderboard.map */}
            <LeaderboardTableItem />
            <LeaderboardTableItem />
            <LeaderboardTableItem />
            <LeaderboardTableItem />
            <LeaderboardTableItem />
            <LeaderboardTableItem />
          </div>
        </div>
        <div className="flex flex-col gap-[25px]">
          <p className="text-2xl text-white font-clashMed">Popular Bets</p>
          <div className="w-[388px] bg-black/50 rounded-[30px] py-[25px] flex flex-col items-center gap-3">
            test
          </div>
        </div>
      </div>
    </div>
  );
}

const LeaderboardTableItem = () => {
  const balanceData = {
    "24h_pct_change": 10,
    "24h_amount_change": 100,
  };
  return (
    <div className="w-full flex items-end justify-between py-[15px] border-b border-[#262626]">
      <div className="w-full flex items-center gap-3">
        <Avatar>
          <AvatarImage src="/player-temp/diggs.webp" />
          <AvatarFallback>
            <Image
              src="/player-temp/diggs.webp"
              alt="user"
              width={30}
              height={30}
            />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <p className="text-white font-clashMed text-[15px] leading-[15px]">
            matt.sol
          </p>
          {/* stat pills */}
          <div className="flex items-center gap-2">
            <div className="border border-[#2F2F2F] rounded-full px-[9px] py-[2.5px]">
              <p className="text-[#888888] font-clash text-[7px] leading-[7px]">
                Vol:{" "}
                <span className="text-white font-clashSemiBold">$1369.02</span>
              </p>
            </div>
            <div className="border border-[#2F2F2F] rounded-full px-[9px] py-[2.5px]">
              <p className="text-[#888888] font-clash text-[7px] leading-[7px]">
                P&L:{" "}
                <span className="text-white font-clashSemiBold">$1369.02</span>
              </p>
            </div>
            <div className="border border-[#2F2F2F] rounded-full px-[9px] py-[2.5px]">
              <p className="text-[#888888] font-clash text-[7px] leading-[7px]">
                Avg. Bet:{" "}
                <span className="text-white font-clashSemiBold">$1369.02</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* pnl */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2.5">
          {balanceData["24h_amount_change"] > 0 ? (
            <TrendUp size={16} />
          ) : (
            <TrendDown size={16} />
          )}
          <p
            className={cn(
              "text-[20px] leading-[20px] font-clashMed",
              balanceData["24h_amount_change"] > 0
                ? "text-green-500"
                : "text-red-500"
            )}
          >
            ${balanceData["24h_amount_change"]}
          </p>
        </div>
      </div>
    </div>
  );
};
