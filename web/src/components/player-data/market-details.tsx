import React from "react";
import { usePlayerMarket, usePlayerToken } from "../web/market-data-access";
import { BN } from "bn.js";

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

const MarketDisplay: React.FC = () => {
  const { market, playerStatsAccount, mintConfigAccount } = usePlayerMarket();
  const { playerTokenMintAccountSupply } = usePlayerToken();

  const PRECISION = 1_000_000; // 6 decimal places
  const actualPoints = playerStatsAccount?.data?.actualPoints ?? 0;
  const supply = playerTokenMintAccountSupply?.data?.toString() ?? "0";

  // Or if you need to keep it as BN:
  const longerPoolBN = new BN(actualPoints)
    .mul(new BN(supply))
    .mul(new BN(PRECISION))
    .div(new BN(1_000_000));
  const longerPoolDecimal = longerPoolBN.toNumber() / PRECISION;
  const totalPot =
    (mintConfigAccount?.data?.totalDepositedAmount?.toNumber() ?? 0) /
    PRECISION;
  const shorterPool = totalPot - longerPoolDecimal;

  return (
    <div className="text-white p-6">
      <section className="about">
        <h1 className="text-3xl font-bold mb-4">About</h1>
        <p className="text-gray-300 mb-8">
          This market is for the total fantasy points scored by{" "}
          {market?.data?.player?.name} in Super Bowl LIX in New Orleans on
          February 9th, 2025.
        </p>
      </section>

      <section className="market-stats grid grid-cols-4 gap-8 mb-8">
        <div>
          <h2 className="text-gray-400">Total Pot</h2>
          <p className="text-xl font-bold">{totalPot.toFixed(4)}</p>
        </div>
        <div>
          <h2 className="text-gray-400">Longer's Pool</h2>
          <p className="text-xl font-bold">{longerPoolDecimal.toFixed(4)}</p>
        </div>
        <div>
          <h2 className="text-gray-400">Shorter's Pool</h2>
          <p className="text-xl font-bold">{shorterPool.toFixed(4)}</p>
        </div>
        <div>
          <h2 className="text-gray-400">Supply</h2>
          <p className="text-xl font-bold">
            {playerTokenMintAccountSupply?.data?.toLocaleString()}
          </p>
        </div>
      </section>

      <section className="live-updates">
        <h1 className="text-3xl font-bold mb-6">Live Updates</h1>

        <div className="current-stats grid grid-cols-3 gap-8 mb-8">
          <div>
            <h2 className="text-gray-400">Current Total</h2>
            <p className="text-3xl font-bold">
              {playerStatsAccount?.data?.actualPoints.toFixed(2)} pts
            </p>
          </div>
          <div>
            <h2 className="text-gray-400">TODO</h2>
            <p className="text-3xl font-bold">TODO</p>
          </div>
          <div>
            <h2 className="text-gray-400">1st & Goal</h2>
            <p className="text-3xl font-bold">TODO</p>
          </div>
        </div>

        <div className="updates-list space-y-4">
          {/* TODO: updates.map */}
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
            <div>
              <span className="text-gray-400">TODO</span>
              <p>TODO</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketDisplay;
