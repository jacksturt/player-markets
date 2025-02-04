"use client";

import React, { useState } from "react";
import MarketDetails, { GameUpdate, MarketStats } from "./market-details";

export enum PlayerDataView {
  DETAILS = "Details",
  TRADE_HISTORY = "Trade History",
  ORDERS = "Orders",
}

const marketStats: MarketStats = {
  marketCap: "1000000",
  totalVolume: "16000",
  liquidity: "1047800",
  supply: 600000000,
};

const gameUpdates: GameUpdate[] = [
  {
    timestamp: "2025-02-09 10:00:00",
    description: "Patrick Mahomes scores 10 points in the first quarter",
  },
];

export default function DataTablesPlayer() {
  const [activeTab, setActiveTab] = useState(PlayerDataView.DETAILS);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="px-5 flex items-center justify-between text-white pr-[50px]">
        {Object.values(PlayerDataView).map((view) => (
          <button
            key={view}
            className={`px-6 py-2 text-white border-b-2 uppercase ${
              activeTab === view ? "border-white" : "border-transparent"
            }`}
            onClick={() => setActiveTab(view)}
          >
            {view}
          </button>
        ))}
      </div>
      {activeTab === PlayerDataView.DETAILS && (
        <MarketDetails
          stats={marketStats}
          currentPoints={10}
          currentQuarter={"Q1"}
          currentTime={"10:00 AM"}
          team={"Kansas City Chiefs"}
          updates={gameUpdates}
        />
      )}
    </div>
  );
}
