import React from "react";
import TrendDown from "@/components/icons/trend-down";
import TrendUp from "@/components/icons/trend-up";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import {
  Position,
  ProfileCard,
  UserStats,
  TradeHistoryItem,
} from "@/components/web/web-ui";

const balanceData = {
  "24h_pct_change": 10,
  "24h_amount_change": 100,
};

export default async function WalletPage() {
  return (
    <div className="w-full min-h-screen overflow-y-auto flex flex-col flex-1 gap-5 bg-gradient-to-b from-[#1E1E1E] via-[#050505] to-black text-white pt-5">
      <Navbar />
      {/* two columns */}
      <div className="w-full h-full flex items-start gap-[70px] px-[120px] pt-8">
        {/* left column - balance, stats, positions etc */}
        <div className="w-full flex flex-col gap-[58px] pb-20">
          <div className="flex items-end justify-between">
            {/* balance */}
            <div className="flex flex-col gap-2">
              <p className="uppercase">My Balance</p>
              <div className="flex items-end gap-3">
                <p className="text-[50px] leading-[50px] font-clashMed bg-chiefs-gradient-bg text-transparent bg-clip-text">
                  ${1920.08}
                </p>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    {balanceData["24h_amount_change"] > 0 ? (
                      <TrendUp size={16} />
                    ) : (
                      <TrendDown size={16} />
                    )}
                    <p
                      className={cn(
                        "text-sm",
                        balanceData["24h_amount_change"] > 0
                          ? "text-green-500"
                          : "text-red-500"
                      )}
                    >
                      {balanceData["24h_pct_change"]}%
                    </p>
                  </div>
                  <p>+$1369.02</p>
                </div>
              </div>
            </div>
            <Button className="bg-white text-black font-clashMed rounded-full py-[17px] px-[28px] hover:bg-white/80">
              Cashout Balance
            </Button>
          </div>
          <UserStats />
          {/* current positions */}
          <div className="w-full flex flex-col">
            <p className="text-2xl text-white font-clashMed">Positions</p>
            <div className="flex items-center justify-between">
              <p className="text-[#6A6A6A] text-[13px]">
                These are your active positions. You can sell or cash out at any
                time.
              </p>
              <Button>Close all</Button>
            </div>
            {/* TODO: positions.map */}
            <div className="w-full flex flex-col gap-2 pt-7">
              <Position
                image="/player-temp/diggs.webp"
                ticker="MAHOMES"
                amount={190}
                usdValue={869.0}
              />
              <Position
                image="/player-temp/diggs.webp"
                ticker="BARKLEY"
                amount={427}
                usdValue={169.98}
              />
              <Position
                image="/player-temp/diggs.webp"
                ticker="HURTS"
                amount={3112}
                usdValue={13669.34}
              />
            </div>
          </div>
          {/* open orders */}
          <div className="w-full flex flex-col">
            <p className="text-2xl text-white font-clashMed">Open Orders</p>
            <div className="flex items-center justify-between">
              <p className="text-[#6A6A6A] text-[13px]">
                Here are your buy and sell orders that are currently
                outstanding.
              </p>
              <Button>Cancel all</Button>
            </div>
            {/* TODO: open orders.map */}
            <div className="w-full flex flex-col gap-2 pt-7">
              <TradeHistoryItem
                image="/player-temp/diggs.webp"
                type="buy"
                ticker="MAHOMES"
                amount={523}
                usdValue={869.0}
                timestamp="Feb 9, 2025 at 7:58:06PM"
              />
              <TradeHistoryItem
                image="/player-temp/diggs.webp"
                type="sell"
                ticker="MAHOMES"
                amount={190}
                usdValue={341.0}
                timestamp="Feb 8, 2025 at 6:36:46PM"
              />
              <TradeHistoryItem
                image="/player-temp/diggs.webp"
                type="buy"
                ticker="MAHOMES"
                amount={45}
                usdValue={23.0}
                timestamp="Feb 8, 2025 at 5:33:11PM"
              />
            </div>
          </div>
          {/* trade history */}
          <div className="w-full flex flex-col">
            <p className="text-2xl text-white font-clashMed">Trade History</p>
            <div className="flex items-center justify-between">
              <p className="text-[#6A6A6A] text-[13px]">
                These are your past trades. Embarrassed yet?
              </p>
            </div>
            {/* TODO: trade history.map */}
            <div className="w-full flex flex-col gap-2 pt-7">
              <TradeHistoryItem
                image="/player-temp/diggs.webp"
                type="buy"
                ticker="MAHOMES"
                amount={523}
                usdValue={869.0}
                timestamp="Feb 9, 2025 at 7:58:06PM"
              />
              <TradeHistoryItem
                image="/player-temp/diggs.webp"
                type="sell"
                ticker="MAHOMES"
                amount={190}
                usdValue={341.0}
                timestamp="Feb 8, 2025 at 6:36:46PM"
              />
              <TradeHistoryItem
                image="/player-temp/diggs.webp"
                type="buy"
                ticker="MAHOMES"
                amount={45}
                usdValue={23.0}
                timestamp="Feb 8, 2025 at 5:33:11PM"
              />
            </div>
          </div>
        </div>
        <ProfileCard />
      </div>

      {/* </div>
      <div className="px-5">
        <PnL />
      </div>
      <DataTablesUser /> */}
    </div>
  );
}
