"use client";

import React, { useState } from "react";

export enum PlayerDataView {
  DETAILS = "details",
  TRADES = "trades",
  MY_TRADES = "my trades",
}

export default function DataTablesPlayer() {
  const [activeTab, setActiveTab] = useState(PlayerDataView.DETAILS);

  return (
    <div className="px-5 flex items-center justify-between text-white">
      {Object.values(PlayerDataView).map((view) => (
        <button
          key={view}
          className={`px-4 py-2 text-white border-b-2 uppercase ${
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
