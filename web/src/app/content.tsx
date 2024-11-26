"use client";
import styles from "@/styles/Leaderboard.module.scss";
import { useCallback, useEffect, useState } from "react";
import { MarketComponent } from "@/components/custom/market";
import { DataTable } from "@/components/tables/data-table";
import { Collector, Creator } from "@/types/table";
import { columns as creatorColumns } from "@/components/tables/creators/columns";
import { columns as collectorColumns } from "@/components/tables/collectors/columns";
import { FetchedMarkets } from "@/types/queries";
import ScrollToTop from "@/components/custom/scroll-to-top";

// shadcn-ui components
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMarkets } from "@/server/leaderboard";
import { Skeleton } from "@/components/ui/skeleton";

type SolanaPrice = {
  solana: {
    usd: number;
  };
};

function LeaderboardContent({
  creators,
  collectors,
}: {
  creators: Creator[];
  collectors: Collector[];
}) {
  const [marketState, setMarketState] = useState<FetchedMarkets[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price" | "priceChange24h" | "time" | "volume">("volume");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [tab, setTab] = useState("bangers");
  const [solPrice, setSolPrice] = useState<number | null>(null);

  async function refreshMarkets() {
    setLoading(true);
    const fetchedMarkets = await getMarkets(sortBy, order);
    setMarketState(fetchedMarkets);
    setLoading(false);
  }

  const fetchSolanaPrice = useCallback(async () => {
    try {
      const response = await fetch("/api/solana-price");

      if (!response.ok) {
        throw new Error("Failed to fetch SOL price");
      }

      const data: SolanaPrice = await response.json();
      console.log("Fetched Sol:", data);
      setSolPrice(data.solana.usd);
    } catch (err) {
      console.error("SOL price fetch error:", err);
    }
  }, []);

  useEffect(() => {
    refreshMarkets();
  }, [sortBy, order]);

  useEffect(() => {
    fetchSolanaPrice();
  }, [fetchSolanaPrice]);

  return (
    <div className={styles.content}>
      <div className={styles.innerContent}>
        <h1 className={styles.heading}>Leaderboard</h1>

        <div className={styles.filters}>
          <Tabs
            defaultValue="bangers"
            className="w-[300px] md:w-[500px]"
            onValueChange={setTab}
            value={tab}
          >
            <TabsList className="w-full flex justify-around">
              <TabsTrigger className="w-1/3" value="bangers">
                Bangers
              </TabsTrigger>
              <TabsTrigger className="w-1/3" value="authors">
                Authors
              </TabsTrigger>
              <TabsTrigger className="w-1/3" value="collectors">
                Collectors
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className={styles.sortOptions}>
            {tab === "bangers" && (
              <>
                {/* @ts-expect-error */}
                <Select onValueChange={setSortBy} value={sortBy}>
                  <SelectTrigger className={styles.sortOptionsTrigger}>
                    <SelectValue placeholder="sort by" />
                  </SelectTrigger>
                  <SelectContent className={styles.sortOptionsContent}>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="priceChange24h">Price Change</SelectItem>
                    <SelectItem value="time">Creation Time</SelectItem>
                  </SelectContent>
                </Select>
                {/* @ts-expect-error */}
                <Select onValueChange={setOrder} value={order}>
                  <SelectTrigger className={styles.sortOptionsTrigger}>
                    <SelectValue placeholder="order" />
                  </SelectTrigger>
                  <SelectContent className={styles.sortOptionsContent}>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {tab === "bangers" && (
          <>
            {loading && (
              <div className={styles.skeletons}>
                {[...Array(9)].map((_, index) => (
                  <div
                    className="flex flex-col space-y-3 items-end w-[640px]"
                    key={index}
                  >
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                  </div>
                ))}
              </div>
            )}
            {!loading && marketState.length > 0 && (
              <div className={styles.markets}>
                {marketState.map((market, index) => (
                  <MarketComponent key={index} data={market} solPrice={solPrice} />
                ))}
              </div>
            )}
            <ScrollToTop />
          </>
        )}

        {tab === "authors" && (
          <div className={styles.dataTable}>
            <DataTable columns={creatorColumns} data={creators} />
          </div>
        )}

        {tab === "collectors" && (
          <div className={styles.dataTable}>
            <DataTable columns={collectorColumns} data={collectors} />
          </div>
        )}
      </div>
    </div>
  );
}

export { LeaderboardContent };
