"use client";

import PlayerCardFront from "./player-card-front";
import { CardView, usePlayerMarketCardStore } from "@/lib/zustand";
import PlayerCardBack from "./player-card-back";

export default function PlayerCard({ market }: { market: any }) {
  const { cardView, activePlayerMarket, selectedOrderType } =
    usePlayerMarketCardStore();
  const isBackView =
    cardView === CardView.BACK &&
    activePlayerMarket === market.publicKey.toBase58();

  return (
    <div className="w-[251px] h-[311px] relative [perspective:1000px]">
      <div
        className={`w-full h-full absolute transition-all duration-500 [transform-style:preserve-3d] rounded-xl overflow-hidden
            ${isBackView ? "[transform:rotateY(180deg)]" : ""}`}
      >
        {!isBackView && (
          <div className="absolute w-full h-full [backface-visibility:hidden]">
            <PlayerCardFront marketAddress={market.publicKey.toBase58()} />
          </div>
          // <div className="w-full h-full bg-red-500">front</div>
        )}
        {isBackView && (
          // <PlayerCardBack
          //   marketAddress={market.publicKey.toBase58()}
          //   enabled={isBackView}
          // />
          <div className="w-full h-full bg-blue-500 [transform:rotateY(180deg)]">{`back, ${selectedOrderType}`}</div>
        )}
      </div>
    </div>
  );
}
