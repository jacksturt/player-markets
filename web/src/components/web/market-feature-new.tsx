"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  useCurrentMarket,
  useLivePlays,
  useManifestClient,
  usePlayerMarket,
  useQuoteToken,
} from "./market-data-access";
import { Trade, ClaimSeat } from "./web-ui";
import { FillLogResult } from "manifest/src";
import toast from "react-hot-toast";
import { para } from "@/lib/para";
import ChartComponent from "@/components/player-data/chart";
import { PlaceOrderLogResult } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/trpc/react";
import DataTablesPlayer from "../player-data/data-tables-player";
import { CashoutAll } from "./web-ui";
const PlayerCard = () => {
  const { market, playerStatsAccount } = usePlayerMarket();
  const { liveProjectedScore } = useLivePlays();
  return (
    <div className="w-full flex items-end justify-between px-[50px]">
      <div className="flex items-center gap-4">
        <Image
          src={market?.data?.baseMint?.image ?? ""}
          alt="player"
          className="rounded-full w-[100px] h-[100px] overflow-hidden object-cover"
          width={100}
          height={100}
        />
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-clashSemiBold">
            {market?.data?.player?.name}
          </p>
          <p className="text-[60px] leading-[58px] font-clashMed bg-chiefs-gradient-text text-transparent bg-clip-text">
            $
            {parseFloat(market?.data?.lastTradePrice.toString() ?? "0").toFixed(
              2
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-row gap-8">
        <div className="flex flex-col">
          <p className="text-sm font-clashGroteskMed">Pregame Projection</p>
          <p className="text-[21px] leading-[21px] font-clashSemiBold">
            {playerStatsAccount?.data?.projectedPoints.toFixed(2)}
            pts
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-clashGroteskMed">Live Projection</p>
          <p className="text-[21px] leading-[21px] font-clashSemiBold">
            {liveProjectedScore.data?.toFixed(2)}
            pts
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-clashGroteskMed">Actual Points</p>
          <p className="text-[21px] leading-[21px] font-clashSemiBold">
            {playerStatsAccount?.data?.actualPoints.toFixed(2)}
            pts
          </p>
        </div>
      </div>
    </div>
  );
};

export default function MarketFeatureNew() {
  const [tradeData, setTradeData] = useState<{ date: number; price: number }[]>(
    []
  );
  const { trades, mintConfigAccount } = usePlayerMarket();
  const { marketAddress } = useCurrentMarket();
  const { hasSeatBeenClaimed } = useManifestClient();
  const { quoteTokenBalance } = useQuoteToken();
  const queryClient = useQueryClient();
  const utils = api.useUtils();
  useEffect(() => {
    async function checkparaSession() {
      const isActive = await para.isSessionActive();
    }
    checkparaSession();
  }, []);

  useEffect(() => {
    if (trades.data) {
      if (trades.data.length > tradeData.length) {
        setTradeData(
          trades.data.map((trade) => ({
            date: trade.createdAt.getTime(),
            price: Number(trade.price),
          }))
        );
      }
    }
  }, [trades.data]);

  useEffect(() => {
    const feedUrl = "wss://fillfeed-production.up.railway.app";
    if (!feedUrl) {
      toast.error("NEXT_PUBLIC_FEED_URL not set");
      throw new Error("NEXT_PUBLIC_FEED_URL not set");
    }
    const ws = new WebSocket(feedUrl);

    ws.onopen = () => {
      console.log("Connected to server");
    };

    ws.onclose = (event) => {
      console.log("Disconnected from server", event);
    };

    ws.onmessage = async (message): Promise<void> => {
      console.log("message", message);
      const event:
        | {
            type: "fill";
            data: FillLogResult;
          }
        | {
            type: "placeOrder";
            data: PlaceOrderLogResult;
          } = JSON.parse(message.data);
      if (event.data.market !== marketAddress) {
        return;
      }
      if (event.type === "fill") {
        console.log("fill", event.data, Date.now());
        setTradeData((prevData) => [
          ...prevData,
          {
            date: Date.now(),
            price: Number(event.data.priceAtoms),
          },
        ]);
        queryClient.invalidateQueries({
          queryKey: ["market", "bids", { marketAddress }],
        });
        queryClient.invalidateQueries({
          queryKey: ["market", "asks", { marketAddress }],
        });
        utils.trade.readForMarket.invalidate({
          marketAddress: marketAddress ?? "",
        });
      } else if (event.type === "placeOrder") {
        queryClient.invalidateQueries({
          queryKey: ["market", "bids", { marketAddress }],
        });
        queryClient.invalidateQueries({
          queryKey: ["market", "asks", { marketAddress }],
        });
        utils.trade.readForMarket.invalidate({
          marketAddress: marketAddress ?? "",
        });
        console.log("placeOrder", event.data);
      }
    };

    // return () => {
    //   ws.close();
    // };
  }, [marketAddress, queryClient, utils]);

  return (
    <div className="w-full flex flex-col gap-[79px] px-14 text-white mb-20">
      <div className="w-full flex items-start gap-10">
        <div className="w-full flex flex-col gap-10 overflow-y-scroll max-h-[85vh]">
          <PlayerCard />
          <ChartComponent data={tradeData} />
          <DataTablesPlayer />
        </div>
        {hasSeatBeenClaimed.data ? (
          <div className="w-[450px]">
            {mintConfigAccount.data?.mintingEnabled && <Trade />}
            {mintConfigAccount.data?.payoutEnabled && <CashoutAll />}
          </div>
        ) : (
          <div className="w-[450px]">
            <ClaimSeat />
          </div>
        )}
      </div>
    </div>
  );
}
