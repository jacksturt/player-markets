import { Market, UserProfile } from "@prisma/client";

type UserProfileWithoutMetadata = Omit<UserProfile, "metadata">;
type MarketWithoutMetadata = Omit<Market, "metadata">;

interface UserProfileWithMetadata extends UserProfileWithoutMetadata {
  metadata: {
    alphaAccess: boolean;
  };
}

interface MarketWithMetadata extends MarketWithoutMetadata {
  metadata: {
    sourceId: string;
    sourceUrl: string;
    sourceAuthoredAt: Date;
  };
}

type RedisUserQuery = {
  twitterId: string;
  name: string;
  username: string;
  image: string;
};

export type { UserProfileWithMetadata, MarketWithMetadata, RedisUserQuery };