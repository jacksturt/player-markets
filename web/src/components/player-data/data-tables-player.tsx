"use client";

import React, { useState } from "react";
import MarketDetails, { GameUpdate, MarketStats } from "./market-details";
import MarketTrades from "./market-trades";
import MarketOrders from "./market-orders";
import PlayDetails from "./play-details";

export enum PlayerDataView {
  DETAILS = "Details",
  PLAYS = "Plays",
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
    <div className="w-full flex flex-col gap-4 overflow-y-scroll">
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
      {activeTab === PlayerDataView.DETAILS && <MarketDetails />}
      {activeTab === PlayerDataView.PLAYS && <PlayDetails />}
      {activeTab === PlayerDataView.TRADE_HISTORY && <MarketTrades />}
      {activeTab === PlayerDataView.ORDERS && <MarketOrders />}
    </div>
  );
}
