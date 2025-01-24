"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export enum PnLTimePeriod {
  Today = "Today",
  Week = "Week",
  Month = "Month",
  Year = "Year",
}

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
          <span className="font-semibold">$4305.35</span>
        </div>

        {/* P&L */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-500 text-sm">P&L</span>
          <span className="font-semibold text-green-500">+$123.69</span>
        </div>

        {/* Max Trade Size */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-500 text-sm">Max Trade Size</span>
          <span className="font-semibold">$777.34</span>
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
