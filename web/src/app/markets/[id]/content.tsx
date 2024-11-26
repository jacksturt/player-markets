"use client";
import styles from "@/styles/Markets.module.scss";
import en from "javascript-time-ago/locale/en";
import TimeAgo from "javascript-time-ago";
import MarketChart from "@/components/custom/charts";
import Image from "next/image";
import { MarketPageData, RarityBalance } from "@/types/queries";
import { useRouter } from "next-nprogress-bar";
import twitter from "@/assets/icons/twitter.svg";
import Link from "next/link";
import { UserProfileLink } from "@/components/custom/user-profile-link";

// shadcn-ui components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { TradeBox } from "@/components/custom/trade-box";
import { useEffect, useState } from "react";
import { getMarketData } from "@/server/markets";
import { $Enums } from "@prisma/client";
import { getBangerCountWithRarity } from "@/lib/on-chain/utils";
import { refreshBangerRarities } from "@/lib/on-chain/bangers";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Loader2, Share } from "lucide-react";
import { UserProfileWithMetadata } from "@/types/db-client";
import { Button } from "@/components/ui/button";

// Add locale-specific relative date/time formatting rules.
TimeAgo.addDefaultLocale(en);
// Create formatter (English).
const timeAgo = new TimeAgo("en-US");

function MarketContent({
  initData,
  user,
}: {
  initData: MarketPageData;
  user: UserProfileWithMetadata | null;
}) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const [data, setData] = useState<MarketPageData>(initData);
  const [isSharing, setIsSharing] = useState(false);
  const [rarityBalance, setRarityBalance] = useState<RarityBalance>({
    total: 0,
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  });
  const [isInitialRarityFetch, setIsInitialRarityFetch] = useState(true);
  const [rarityLoading, setRarityLoading] = useState(false);

  const userStatus = user
    ? user?.metadata?.alphaAccess
      ? "Good"
      : "Invite Required"
    : "Login Required";

  const addWPProxy = (url: string): string => {
    if (!url) return url;
    if (url.startsWith("https://i0.wp.com/")) return url;
    // Don't proxy local/default images
    if (url.startsWith("/")) return url;
    return `https://i0.wp.com/${url.replace(/^https?:\/\//, "")}`;
  };

  const getFallbackAvatarUrl = (username: string): string => {
    return `https://source.boringavatars.com/beam/120/${encodeURIComponent(
      username
    )}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
  };

  useEffect(() => {
    async function fetchRarityBalance() {
      if (!publicKey) return;
      try {
        // Only show loading on initial fetch
        if (isInitialRarityFetch) {
          setRarityLoading(true);
        }

        const balance = await getBangerCountWithRarity(
          publicKey,
          new PublicKey(data.collectionPublicKey)
        );

        console.log(balance);
        setRarityBalance(balance);
      } catch (error) {
        console.error("Error fetching rarity balance:", error);
      } finally {
        // Turn off loading and mark initial fetch as complete
        if (isInitialRarityFetch) {
          setRarityLoading(false);
          setIsInitialRarityFetch(false);
        }
      }
    }
    // Initial fetch
    fetchRarityBalance();
    const interval = setInterval(fetchRarityBalance, 4000);
    return () => clearInterval(interval);
  }, [publicKey]);

  useEffect(() => {
    const interval = setInterval(async () => {
      console.log("Updating market data");
      const updatedData = await getMarketData(data.tweetId);
      console.log("Updated Data:", updatedData);
      if (updatedData) setData(updatedData);
    }, 6000);
    return () => clearInterval(interval);
  }, []);
  // In your MarketContent component, update the handleShare function:

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const text = `This tweet by @${data.author.username} is going banger at @bangerdotlol`;
      // Use market page URL instead of direct tweet URL for proper OG tags
      const url = `https://banger.lol/markets/${data.tweetId}`;

      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`;

      window.open(shareUrl, "_blank");
    } catch (error) {
      console.error("Failed to share:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className={styles.threeColumnLayout}>
      <div className={styles.leftColumn}>
        <div className={`${styles.mediaContainer}`}>
          <Link
            href={`https://x.com/${data.author.username}/status/${data.tweetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full flex items-center justify-center"
          >
            <img
              className={`${styles.mediaImage}`}
              src={data.media.imageUrl}
              alt=""
            />
          </Link>
        </div>
        <div className={styles.topCollectors}>
          <h1 className={styles.topCollectorsTitle}>Top Collectors</h1>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topCollectors.map((collector) => (
                <TableRow key={collector.username}>
                  <TableCell>
                    {collector.rank === 1 ? '🥇' :
                     collector.rank === 2 ? '🥈' :
                     collector.rank === 3 ? '🥉' :
                     collector.rank}
                  </TableCell>
                  <TableCell>
                    <UserProfileLink
                      username={collector.username}
                      image={collector.image}
                    />
                  </TableCell>
                  <TableCell>{collector.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className={styles.centerColumn}>
        <div className={styles.innerContent}>
          <div className={styles.marketDataChild}>
            <Table
              className={`overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-sky-700 scrollbar-track-sky-300`}
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Price</TableHead>
                  <TableHead>Market Cap</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Holders</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{data.buyPrice.toFixed(3)} SOL</TableCell>
                  <TableCell>
                    {(data.buyPrice * data.supply).toFixed(3)} SOL
                  </TableCell>
                  <TableCell>{data.rank}</TableCell>
                  <TableCell>{data.holders}</TableCell>
                  <TableCell>
                    <UserProfileLink
                      username={data.author.username}
                      image={data.author.image}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`https://x.com/${data.author.username}/status/${data.tweetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-center">
                        <Image
                          src={twitter}
                          alt="twitter-logo"
                          height={25}
                          width={25}
                        />
                      </div>
                    </Link>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Separator />
            <div className="flex justify-center">
              <Button
                onClick={handleShare}
                disabled={isSharing}
                className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-2 px-4 rounded-full flex items-center justify-center mt-4 mb-2"
              >
                <Share className="mr-2 h-4 w-4" />
                {isSharing ? "Sharing..." : "Share on X"}
              </Button>
            </div>
          </div>
          <div className={styles.tradingViewContainer}>
            {data.trades.length > 0 ? (
              <MarketChart trades={data.trades} />
            ) : (
              <div className={styles.noTrades}>No trades yet</div>
            )}
          </div>
        </div>
        {data.trades.length > 0 ? (
          <div className={styles.trades}>
            <h1 className={styles.tradesTitle}>Recent Trades</h1>
            <Table className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-[#f2c1fb] scrollbar-track-[#f2c1fb]">
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.trades.map((trade, index) => (
                  <TableRow
                    key={index}
                    style={{
                      color:
                        trade.type === $Enums.TradeSide.BUY ? "#81F052" : "red",
                    }}
                  >
                    <TableCell className="font-medium" suppressHydrationWarning>
                      {timeAgo.format(trade.time)}
                    </TableCell>
                    <TableCell
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        router.push(`/${trade.username}`);
                      }}
                    >
                      <div className="flex items-center justify-center cursor-pointer">
                        <Image
                          src={trade.image}
                          alt={`${trade.username}'s avatar`}
                          width={24}
                          height={24}
                          className="rounded-full mr-2"
                        />
                        <span>{trade.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trade.type === $Enums.TradeSide.BUY ? "BUY" : "SELL"}
                    </TableCell>
                    <TableCell>{trade.amount}</TableCell>
                    <TableCell>{trade.totalValue.toFixed(4)} SOL</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className={styles.trades}>
            <p className={styles.noTradesText}>No trades yet</p>
          </div>
        )}
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.buyContainer}>
          <TradeBox
            data={data}
            rarityBalance={rarityBalance}
            userStatus={userStatus}
          />
        </div>
        <div className={styles.collectionContainer}>
          <h1 className={styles.collectionTitle}>My Collection</h1>
          <div className={styles.rarityGrid}>
            {Object.keys(rarityBalance)
              .filter((rarity) => rarity !== "total")
              .map((rarity) => (
                <div
                  key={rarity}
                  className={`${styles.rarityItem} ${
                    styles[
                      `rarityItem${
                        rarity.charAt(0).toUpperCase() + rarity.slice(1)
                      }`
                    ]
                  }`}
                >
                  <h3>{rarity.charAt(0).toUpperCase() + rarity.slice(1)}</h3>
                  {publicKey ? (
                    rarityLoading && isInitialRarityFetch ? (
                      <div className="flex items-center justify-center py-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <p>{rarityBalance[rarity as keyof RarityBalance]}</p>
                    )
                  ) : (
                    <p>-</p>
                  )}
                </div>
              ))}
          </div>
          <div className="mt-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-3 rounded-md border border-[#f2c1fb]">
                <span className="text-sm text-gray-400">Total Spent</span>
                <span className="text-lg font-semibold">
                  {data.userStats?.totalSpent.toFixed(5) || "0"} SOL
                </span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-md border border-[#f2c1fb]">
                <span className="text-sm text-gray-400">Net Worth</span>
                <span className="text-lg font-semibold">
                  {(data.buyPrice * rarityBalance.total || 0).toFixed(5)} SOL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { MarketContent };
