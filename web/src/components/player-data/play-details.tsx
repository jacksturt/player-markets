import React from "react";
import {
  useLivePlays,
  usePlayerMarket,
  usePlayerToken,
} from "../web/market-data-access";
import { BN } from "bn.js";
import {
  convertDownAndDistanceToBetterString,
  quarterNameToBetterString,
} from "@/lib/utils";

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

const PlayDetails: React.FC = () => {
  const { playerStatsAccount } = usePlayerMarket();
  const { latestPlay, playsByTeam, playsByPlayer } = useLivePlays();

  return (
    <div className="text-white p-6 overflow-y-scroll">
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
            <h2 className="text-gray-400">
              {quarterNameToBetterString(latestPlay.data?.quarterName ?? "")}
            </h2>
            <p className="text-3xl font-bold">
              {latestPlay.data?.timeRemainingMinutes}:
              {latestPlay.data?.timeRemainingSeconds}
            </p>
          </div>
          <div>
            <h2 className="text-gray-400">
              {convertDownAndDistanceToBetterString(
                latestPlay.data?.down ?? 0,
                latestPlay.data?.distance ?? 0
              )}
            </h2>
            <p className="text-3xl font-bold">
              {latestPlay.data?.yardsToEndZone} yards to go
            </p>
          </div>
        </div>

        <div className="updates-list space-y-4">
          {playsByPlayer.data?.map((play) => (
            <div key={play.id} className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
              <div className="flex flex-row gap-1">
                <span className="text-white">
                  {quarterNameToBetterString(play.play.quarterName)} @{" "}
                  {play.play.timeRemainingMinutes}:
                  {play.play.timeRemainingSeconds}
                </span>
                <span className="text-gray-400">{play.play.description}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PlayDetails;
