import React from "react";

export interface MarketStats {
  marketCap: string;
  totalVolume: string;
  liquidity: string;
  supply: number;
}

export interface GameUpdate {
  timestamp: string;
  description: string;
}

export interface MarketDisplayProps {
  stats: MarketStats;
  currentPoints: number;
  currentQuarter: string;
  currentTime: string;
  team: string;
  updates: GameUpdate[];
}

const MarketDisplay: React.FC<MarketDisplayProps> = ({
  stats,
  currentPoints,
  currentQuarter,
  currentTime,
  team,
  updates,
}) => {
  return (
    <div className="text-white p-6">
      <section className="about">
        <h1 className="text-3xl font-bold mb-4">About</h1>
        <p className="text-gray-300 mb-8">
          This market is for the total fantasy points scored by Patrick Mahomes
          in Super Bowl LIX in New Orleans on February 9th, 2025.
        </p>
      </section>

      <section className="market-stats grid grid-cols-4 gap-8 mb-8">
        <div>
          <h2 className="text-gray-400">Market Cap</h2>
          <p className="text-xl font-bold">{stats.marketCap}</p>
        </div>
        <div>
          <h2 className="text-gray-400">Total Volume</h2>
          <p className="text-xl font-bold">{stats.totalVolume}</p>
        </div>
        <div>
          <h2 className="text-gray-400">Liquidity</h2>
          <p className="text-xl font-bold">{stats.liquidity}</p>
        </div>
        <div>
          <h2 className="text-gray-400">Supply</h2>
          <p className="text-xl font-bold">{stats.supply.toLocaleString()}</p>
        </div>
      </section>

      <section className="live-updates">
        <h1 className="text-3xl font-bold mb-6">Live Updates</h1>

        <div className="current-stats grid grid-cols-3 gap-8 mb-8">
          <div>
            <h2 className="text-gray-400">Current Total</h2>
            <p className="text-3xl font-bold">{currentPoints} pts</p>
          </div>
          <div>
            <h2 className="text-gray-400">{currentQuarter}</h2>
            <p className="text-3xl font-bold">{currentTime}</p>
          </div>
          <div>
            <h2 className="text-gray-400">1st & Goal</h2>
            <p className="text-3xl font-bold">{team}</p>
          </div>
        </div>

        <div className="updates-list space-y-4">
          {updates.map((update, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
              <div>
                <span className="text-gray-400">{update.timestamp}</span>
                <p>{update.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MarketDisplay;
