import { z } from "zod";

const userMetadata = z.object({
  avatarUrl: z.string(),
  name: z.string(),
  username: z.string(),
  twitterId: z.string(),
});

const CreateMarketRequest = z.object({
  author: userMetadata,
  curator: userMetadata,
  text: z.string(),
  platform: z.string(),
  imageUrl: z.string(),
  rawMetadataUrl: z.string(),
  metadata: z.object({
    sourceId: z.string(),
    sourceUrl: z.string(),
    sourceAuthoredAt: z.string(),
  }),
});

const CreateMarketRequestTypeWithoutCurator = CreateMarketRequest.omit({ curator: true });
export type CreateMarketRequestType = z.infer<typeof CreateMarketRequestTypeWithoutCurator>;
export { CreateMarketRequest };