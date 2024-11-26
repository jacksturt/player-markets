"use client";
import styles from "@/styles/Profile.module.scss";
import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FetchedMarkets, UserProfileData } from "@/types/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketComponent } from "@/components/custom/market";
import {
  followUser,
  getUserMarkets,
  unfollowUser,
  getUserCuratorRewards,
  getUserInvites,
} from "@/server/user";
import { getFallbackAvatarUrl, higherResImage } from "@/lib/utils";
import { TwitterLogoIcon } from "@radix-ui/react-icons";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {
  handleClaimAuthorRewards,
  handleClaimCuratorRewards,
} from "@/lib/on-chain/claim";
import { getUserAuthorRewards } from "@/server/user";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "@coral-xyz/anchor";
import { toast } from "@/components/ui/use-toast";
import RewardsCard from "@/components/custom/reward-card";
import InviteCard from "@/components/custom/invite-card";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BellIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next-nprogress-bar";
import { login } from "../auth/actions";
import { UserProfileWithMetadata } from "@/types/db-client";
("@/types/db-client");

type SolanaPrice = {
  solana: {
    usd: number;
  };
};

function ProfileContent({
  data,
  currentUser,
}: {
  data: UserProfileData;
  currentUser: UserProfileWithMetadata | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<
    "owned" | "authored" | "launched" | "rewards" | "invites"
  >("owned");
  const [sortBy, setSortBy] = useState<"price" | "time" | "volume">("price");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(true);
  const [marketState, setMarketState] = useState<FetchedMarkets[]>([]);
  const [userFollows, setUserFollows] = useState<boolean | null>(
    data.currentUserFollows
  );
  const [score, setScore] = useState(0);
  const [claimableCuratorRewards, setClaimableCuratorRewards] = useState(0);
  const [totalCuratorRewards, setTotalCuratorRewards] = useState(0);
  const [claimableAuthorRewards, setClaimableAuthorRewards] = useState(0);
  const [totalAuthorRewards, setTotalAuthorRewards] = useState(0);
  const [invites, setInvites] = useState<{ code: string; uses: number }[]>([]);
  const [curatorRewardsLoading, setCuratorRewardsLoading] = useState(false);
  const [authorRewardsLoading, setAuthorRewardsLoading] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  // const isOwnProfile = userFollows === null;
  const supabase = createClient();
  const isOwnProfile = currentUser?.id === data.id;
  const logout = () => {
    supabase.auth
      .signOut()
      /*
      .then(() => {
        setUser(null);
      })
        */
      .catch((error) => {
        console.log(error);
      });
  };

  function updateInvites(newInvite: { code: string; uses: number }) {
    setInvites((prev) =>
      prev.map((invite) =>
        invite.code === newInvite.code ? newInvite : invite
      )
    );
  }

  useEffect(() => {
    async function fetchMarkets() {
      if (!data.twitterId) return;
      setLoading(true);
      const markets = await getUserMarkets(
        data.twitterId,
        tab as "owned" | "authored" | "launched",
        sortBy,
        order
      );
      console.log("markets", markets);
      setMarketState(markets);
      setLoading(false);
    }
    fetchMarkets();
  }, [data.twitterId, tab, sortBy, order]);

  useEffect(() => {
    async function fetchClaimableAuthorRewards() {
      if (!data.twitterId) return;
      const { claimable, total } = await getUserAuthorRewards(data.twitterId);
      setClaimableAuthorRewards(Number(claimable));
      setTotalAuthorRewards(Number(total));
    }
    const interval = setInterval(fetchClaimableAuthorRewards, 3000);
    return () => clearInterval(interval);
  }, [data.twitterId]);

  useEffect(() => {
    async function fetchClaimableCuratorRewards() {
      if (!data.twitterId) return;
      const { score, claimable, total } = await getUserCuratorRewards(
        data.twitterId
      );
      setScore(Number(score));
      setClaimableCuratorRewards(Number(claimable / LAMPORTS_PER_SOL));
      setTotalCuratorRewards(Number(total / LAMPORTS_PER_SOL));
    }
    const interval = setInterval(fetchClaimableCuratorRewards, 3000);
    return () => clearInterval(interval);
  }, [data.twitterId]);

  useEffect(() => {
    async function fetchInvites() {
      if (!data.id) return;
      const fetchedInvites = await getUserInvites(data.id);
      setInvites(fetchedInvites);
    }
    const interval = setInterval(fetchInvites, 2000);
    return () => clearInterval(interval);
  }, [data.id]);
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
    fetchSolanaPrice();
  }, [fetchSolanaPrice]);

  const formatUSD = (solAmount: number) => {
    if (!solPrice) return null;
    const usdAmount = solAmount * solPrice;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdAmount);
  };

  return (
    <div className={styles.innerContent}>
      <div className={styles.profileData}>
        <img
          src={higherResImage(data.image) || ""}
          alt="profile image"
          onError={(e) => {
            e.currentTarget.onerror = null; // Prevent infinite loop
            e.currentTarget.src = getFallbackAvatarUrl(data.username || "");
          }}
        />
        <h1>{data.name}</h1>
        <div className={styles.username}>
          <div className="flex items-center gap-2">
            <h2>@{data.username}</h2>
            <a
              href={`https://x.com/${data.username}`}
              target="_blank"
              rel="noreferrer"
            >
              <TwitterLogoIcon className="h-6 w-6" />
            </a>
          </div>
        </div>
        {isOwnProfile && currentUser && (
          <Button
            className="px-8 h-10 mt-4"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            Logout
          </Button>
        )}
        {!isOwnProfile && currentUser && (
          <Button
            className="px-8 h-10 mt-4"
            onClick={
              userFollows
                ? async () => {
                    setUserFollows(false);
                    const res = await unfollowUser(data.id);
                    console.log(res);
                  }
                : async () => {
                    setUserFollows(true);
                    const res = await followUser(data.id);
                    console.log(res);
                  }
            }
            // variant={userFollows ? "outline" : "secondary"}
          >
            {userFollows ? "Following" : "Follow"}
          </Button>
        )}
        <div className={styles.profileDataDetails}>
          <div className={styles.profileDataLeft}>
            <span>
              Net Worth: {data.netWorth.toString()} SOL
              <span className="text-[#f2c1fb] px-2">
                ({formatUSD(Number(data.netWorth.toString()))}){" "}
              </span>
            </span>
            <span>
              Market Cap: {data.marketCap.toString()} SOL
              <span className="text-[#f2c1fb] px-2">
                ({formatUSD(Number(data.marketCap.toString()))}){" "}
              </span>
            </span>
          </div>
          <div className={styles.profileDataRight}>
            {isOwnProfile && data.secret && (
              <div className="flex items-center">
                <p className="justify-end">Secret: {data.secret}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span onClick={(e) => e.stopPropagation()}>
                        <Info className="ml-2 h-4 w-4 hover:text-brandBg" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="flex items-center gap-2">
                        {" "}
                        Use this to setup notifications{" "}
                        <BellIcon height={20} width={20} />{" "}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className={styles.profileContent}>
        <Tabs
          defaultValue="owned"
          className="flex items-center"
          onValueChange={(value) =>
            setTab(
              value as "owned" | "authored" | "launched" | "rewards" | "invites"
            )
          }
          value={tab}
        >
          <TabsList>
            <TabsTrigger value="owned">Collection</TabsTrigger>
            <TabsTrigger value="authored">Authored</TabsTrigger>
            <TabsTrigger value="launched">Launched</TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="rewards" className="text-[#f2c1fb]">
                Rewards
              </TabsTrigger>
            )}
            {isOwnProfile && (
              <TabsTrigger value="invites" className="text-[#f2c1fb]">
                Invites
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        {tab !== "rewards" && tab !== "invites" && (
          <>
            <div className={styles.sortOptions}>
              <>
                {/* @ts-expect-error */}
                <Select onValueChange={setSortBy} value={sortBy}>
                  <SelectTrigger className={styles.sortOptionsTrigger}>
                    <SelectValue placeholder="sort by" />
                  </SelectTrigger>
                  <SelectContent className={styles.sortOptionsContent}>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="time">Creation Time</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
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
            </div>
          </>
        )}

        {tab !== "rewards" && tab !== "invites" && (
          <>
            {loading && (
              <div className={styles.skeletons}>
                {[...Array(4)].map((_, index) => (
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
                  <MarketComponent
                    key={index}
                    data={market}
                    showBangersOwned={tab === "owned"}
                    solPrice={solPrice}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "rewards" && (
          <div className={styles.rewardsPanel}>
            <RewardsCard
              title="Curator Rewards"
              score={score}
              claimable={claimableCuratorRewards}
              onClaim={async () => {
                try {
                  setCuratorRewardsLoading(true);
                  const authUser = await supabase.auth.getUser();
                  const sig = await handleClaimCuratorRewards(
                    authUser.data.user?.user_metadata.provider_id!,
                    claimableCuratorRewards * LAMPORTS_PER_SOL,
                    wallet,
                    anchorWallet as Wallet,
                    toast
                  );
                  // Only update the state if claim was successful
                  if (sig) {
                    setClaimableCuratorRewards(0); // Reset claimable amount
                    return sig;
                  }
                } catch (error) {
                  console.error("Error claiming curator rewards:", error);
                  throw error; // Let the RewardsCard component handle the error
                } finally {
                  setCuratorRewardsLoading(false);
                }
              }}
              loading={curatorRewardsLoading}
            />
            <RewardsCard
              title="Author Rewards"
              claimable={claimableAuthorRewards}
              onClaim={async () => {
                try {
                  setAuthorRewardsLoading(true);
                  const authUser = await supabase.auth.getUser();
                  const sig = await handleClaimAuthorRewards(
                    authUser.data.user?.user_metadata.provider_id!,
                    wallet,
                    anchorWallet as Wallet,
                    toast
                  );
                  // Only update the state if claim was successful
                  if (sig) {
                    setClaimableAuthorRewards(0); // Reset claimable amount
                    return sig;
                  }
                } catch (error) {
                  console.error("Error claiming author rewards:", error);
                  throw error; // Let the RewardsCard component handle the error
                } finally {
                  setAuthorRewardsLoading(false);
                }
              }}
              loading={authorRewardsLoading}
            />
          </div>
        )}
        {tab === "invites" && (
          <div className="flex justify-center mt-10">
            <InviteCard
              username={data.username}
              twitterId={data.twitterId}
              invites={invites}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export { ProfileContent };
