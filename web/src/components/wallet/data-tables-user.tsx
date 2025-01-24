"use client";

import React, { useState } from "react";

export enum UserDataView {
  POSITIONS = "positions",
  HISTORY = "history",
  MY_TRADES = "trades",
}

export default function DataTablesUser() {
  const [activeTab, setActiveTab] = useState(UserDataView.POSITIONS);

  return (
    <div className="mt-5 px-5 flex items-center justify-between">
      {Object.values(UserDataView).map((view) => (
        <button
          key={view}
          className={`px-4 py-2 text-black border-b-2 uppercase ${
            activeTab === view ? "border-black" : "border-transparent"
          }`}
          onClick={() => setActiveTab(view)}
        >
          {view}
        </button>
      ))}
    </div>
  );
}
