"use client";

import React, { useState } from "react";

export enum PlayerDataView {
  DETAILS = "Details",
  TRADE_HISTORY = "Trade History",
  ORDERS = "Orders",
}

export default function DataTablesPlayer() {
  const [activeTab, setActiveTab] = useState(PlayerDataView.DETAILS);

  return (
    <div className="px-5 flex items-center justify-between text-white">
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
  );
}
