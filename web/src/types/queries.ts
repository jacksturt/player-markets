import { $Enums, Market, Media } from "@prisma/client";

interface FetchedMarkets {
  id: string;
  createdAt: Date;
  mediaId: string;
  tweetId: string;
  supply: number;
  buyPrice: number;
  sellPrice: number | null;
  marketCap: number | null;
  priceChange24h: number | null;
  authorVaultPublicKey: string;
  signature: string | null;
  media: {
    id: string;
    platform: string;
    imageUrl: string;
  };
  ownedBangers?: RarityBalance;
  netWorth?: number;
}

interface MarketPageData {
  id: string;
  createdAt: Date;
  mediaId: string;
  tweetId: string;
  authorId: string;
  supply: number;
  buyPrice: number;
  sellPrice: number;
  marketCap: number;
  metadataURL: string;
  lookupTableAddress: string;
  collectionPublicKey: string;
  authorVaultPublicKey: string;
  signature: string | null;
  author: {
    username: string | null;
    image: string | null;
  };
  media: {
    id: string;
    platform: string;
    authorId: string;
    imageUrl: string;
    createdAt: Date;
    name: string;
  };
  trades: {
    time: Date;
    image: string;
    username: string;
    type: $Enums.TradeSide;
    amount: number;
    totalValue: number;
    supplyAfterTrade: number;
  }[];
  holders: number;
  rank: number; // more supply = higher rank
  topCollectors: {
    rank: number;
    username: string;
    image: string | null;
    amount: number;
  }[];
  userStats?: {
    totalSpent: number;
    netWorth: number;
  };
}

interface MarketChartData {
  date: string;
  price: number;
}

interface TrendingMarket {
  marketId: string;
  tradeVolume: number;
  media?: Media;
  priceChg24h: number;
}

interface UserProfileData {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  twitterId: string | null;
  marketCap: number;
  netWorth: number;
  createdAt: Date;
  updatedAt: Date;
  currentUserFollows: boolean | null;
  secret: string | null;
  claimableCuratorRewards: number | null;
  totalCuratorRewards: number | null;
  score: number | null;
  totalAuthorRewards: number | null;
}

enum ActivityType {
  MINT = "MINT",
  BURN = "BURN",
  AUTHOR = "AUTHOR",
  LAUNCH = "LAUNCH",
}

interface Activity {
  activityType: ActivityType;
  market: {
    id: string;
    tweetId: string;
    createdAt: Date;
    supply: number;
    buyPrice: number;
    priceChange24h: number;
    authorUsername: string;
    media: {
      id: string;
      platform: string;
      authorId: string;
      imageUrl: string;
      createdAt: Date;
      name: string;
    };
  };
  user: {
    name: string | null;
    username: string | null;
    twitterId: string | null;
    image: string | null;
  };
  createdAt: Date;
}

interface RarityBalance {
  total: number;
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

interface TopTradesUser {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  tradeCount: number;
}

interface CreateMarketIndex {
  tweetId: string;
  text: string;
  imageUrl: string;
  author: {
    name: string;
    username: string;
    image: string;
    twitterId: string;
  };
}

type MarketWithoutDecimals = Omit<
  Market,
  "marketCap" | "buyPrice" | "sellPrice"
>;

interface MarketWithNumbers extends MarketWithoutDecimals {
  marketCap: number;
  buyPrice: number;
  sellPrice: number;
}

export type {
  FetchedMarkets,
  MarketPageData,
  MarketChartData,
  TrendingMarket,
  UserProfileData,
  Activity,
  RarityBalance,
  TopTradesUser,
  CreateMarketIndex,
  MarketWithNumbers,
};
export { ActivityType };
