import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TrendUp from "@/components/icons/trend-up";
import { cn } from "@/lib/utils";
import TrendDown from "@/components/icons/trend-down";

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
              width={40}
              height={40}
            />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <p className="text-white font-clashMed text-lg">matt.sol</p>
          {/* stat pills */}
          <div className="flex items-center gap-2">
            <div className="border border-[#2F2F2F] rounded-full px-[9px] py-1">
              <p className="text-[#888888] text-[8px] leading-[8px]">
                Vol:{" "}
                <span className="text-white font-sfProSemibold">$1369.02</span>
              </p>
            </div>
            <div className="border border-[#2F2F2F] rounded-full px-[9px] py-1">
              <p className="text-[#888888] text-[8px] leading-[8px]">
                P&L:{" "}
                <span className="text-white font-sfProSemibold">$1369.02</span>
              </p>
            </div>
            <div className="border border-[#2F2F2F] rounded-full px-[9px] py-1">
              <p className="text-[#888888] text-[8px] leading-[8px]">
                Avg. Bet:{" "}
                <span className="text-white font-sfProSemibold">$1369.02</span>
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

export default LeaderboardTableItem;
