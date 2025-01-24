"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export enum PnLTimePeriod {
  Today = "Today",
  Week = "Week",
  Month = "Month",
  Year = "Year",
}

const walletData = {
  balance: 1920.08,
  volume: 4305.35,
  pnl: -123.69,
  maxTradeSize: 777.34,
};

export default function PnL() {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(
    PnLTimePeriod.Today
  );

  return (
    <div className="w-full p-6 rounded-xl bg-[#E8E8E8]">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 mb-6">
        {/* Volume */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-500 text-sm">Volume</span>
          <span className="font-semibold">${walletData.volume}</span>
        </div>

        {/* P&L */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-500 text-sm">P&L</span>
          <span
            className={cn(
              "font-semibold",
              walletData.pnl > 0 ? "text-green-500" : "text-red-500"
            )}
          >
            {walletData.pnl > 0 ? "+" : "-"}${walletData.pnl}
          </span>
        </div>

        {/* Max Trade Size */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-500 text-sm">Max Trade Size</span>
          <span className="font-semibold">${walletData.maxTradeSize}</span>
        </div>
      </div>

      {/* Time Period Tabs */}
      <div className="flex gap-2 items-center justify-center">
        {Object.values(PnLTimePeriod).map((timePeriod) => (
          <button
            key={timePeriod}
            className={cn(
              "px-4 py-2 rounded-full text-gray-600",
              timePeriod === selectedTimePeriod && "bg-[#6366F1] text-white"
            )}
            onClick={() => setSelectedTimePeriod(timePeriod)}
          >
            {timePeriod}
          </button>
        ))}
      </div>
    </div>
  );
}
