"use client";
import styles from "@/styles/Leaderboard.module.scss";
import { useCallback, useEffect, useState } from "react";
import { Activity } from "@/types/queries";
import { ActivityComponent } from "@/components/custom/activity";
import { getFollowingActivities, getGlobalActivities } from "@/server/feed";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcwIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SolanaPrice = {
  solana: {
    usd: number;
  };
};

function FeedContent() {
  const [loading, setLoading] = useState(true);
  const [feedState, setFeedState] = useState<Activity[]>([]);
  const [tab, setTab] = useState("global");
  const [solPrice, setSolPrice] = useState<number | null>(null);
  
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

  async function refreshFeed() {
    setLoading(true);
    try {
      const fetchedFeed =
        tab === "global"
          ? await getGlobalActivities(20)
          : await getFollowingActivities(20);
      setFeedState(fetchedFeed);
    } catch (error) {
      console.error("Error fetching feed:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSolanaPrice();
  }, [fetchSolanaPrice]);

  useEffect(() => {
    refreshFeed();
    const interval = setInterval(refreshFeed, 60000);
    return () => clearInterval(interval);
  }, [tab]);

  return (
    <div className={styles.content}>
      <div className={styles.innerContent}>
        <h1 className={styles.feedHeading}>
          Feed
          <span onClick={refreshFeed}>
            <RefreshCcwIcon
              className={`ml-2 h-8 w-8 ${loading ? "animate-spin" : ""}`}
            />
          </span>
        </h1>
        <div className={styles.filters}>
          <Tabs
            defaultValue="global"
            className="w-[300px] md:w-[500px]"
            onValueChange={setTab}
            value={tab}
          >
            <TabsList className="w-full flex justify-around">
              <TabsTrigger className="w-1/2" value="global">
                Global
              </TabsTrigger>
              <TabsTrigger className="w-1/2" value="following">
                Following
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === "global" && (
            <>
              <div className={styles.feedMarkets}>
                {loading && (
                  <div className={styles.feedSkeletons}>
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
                {!loading &&
                  feedState.map((activity, index) => (
                    <ActivityComponent
                      key={`${activity.market.tweetId}-${activity.activityType}-${index}`}
                      data={activity}
                      solPrice={solPrice}
                    />
                  ))}
                {!loading && feedState.length === 0 && (
                  <div className={styles.noTweets}>
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "following" && (
            <>
              <div className={styles.feedMarkets}>
                {loading && (
                  <div className={styles.feedSkeletons}>
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
                {!loading &&
                  feedState.map((activity, index) => (
                    <ActivityComponent
                      key={index}
                      data={activity}
                      solPrice={solPrice}
                    />
                  ))}
                {!loading && feedState.length === 0 && (
                  <div className={styles.noTweets}>
                    <p>Follow some users to see their activity here</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { FeedContent };
