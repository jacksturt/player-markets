import BackArrow from "@/components/icons/back-arrow";
import DataTablesUser from "@/components/wallet/data-tables-user";
import Link from "next/link";
import React from "react";
import PnL from "./pnl";
import TrendDown from "@/components/icons/trend-down";
import TrendUp from "@/components/icons/trend-up";
import { cn } from "@/lib/utils";
const balanceData = {
  "24h_pct_change": 10,
  "24h_amount_change": 100,
};

export default async function WalletPage() {
  return (
    <div className="w-full h-screen flex flex-col gap-5">
      <Link href="/home" className="mt-5 px-5">
        <BackArrow size={20} />
      </Link>
      <div className="px-5">
        <p className="uppercase">Balance</p>
        <div className="flex items-end justify-between">
          <p className="text-[50px] leading-[50px] font-clashSemiBold">
            ${1920.08}
          </p>
        </div>
        <div className="flex gap-2 pt-2">
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
          <p className="text-sm text-[#B9B9B9]">
            {balanceData["24h_amount_change"] > 0 ? "+" : "-"}$
            {balanceData["24h_amount_change"]}
          </p>
        </div>
      </div>
      <div className="px-5">
        <PnL />
      </div>
      <DataTablesUser />
    </div>
  );
}
