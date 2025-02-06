import BackArrow from "@/components/icons/back-arrow";
import DataTablesUser from "@/components/wallet/data-tables-user";
import Link from "next/link";
import React from "react";
import PnL from "./pnl";
import TrendDown from "@/components/icons/trend-down";
import TrendUp from "@/components/icons/trend-up";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/web/web-ui";

const balanceData = {
  "24h_pct_change": 10,
  "24h_amount_change": 100,
};

export default async function WalletPage() {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col gap-5 bg-gradient-to-b from-[#1E1E1E] via-[#050505] to-black text-white pt-5">
      <Navbar />
      {/* two columns */}
      <div className="w-full h-full flex items-start gap-[70px] px-[120px] pt-8">
        {/* left column - balance, stats, positions etc */}
        <div className="w-full flex flex-col gap-[58px]">
          <div className="flex items-end justify-between">
            {/* balance */}
            <div className="flex flex-col gap-2">
              <p className="uppercase">My Balance</p>
              <div className="flex items-end gap-3">
                <p className="text-[50px] leading-[50px] font-clashMed">
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
            {/* cash out */}
            <Button className="bg-white text-black font-clashMed rounded-full py-[17px] px-[28px] hover:bg-white/80">
              Cashout Balance
            </Button>
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
