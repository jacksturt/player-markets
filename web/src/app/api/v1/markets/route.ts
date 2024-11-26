import prisma from "@/lib/db";
import { ZodError } from "zod";
import { initPool } from "@/lib/on-chain/init-pool";
import { fromZodError } from "@/lib/utils";
import { CreateMarketRequest } from "@/server/zod";
import { createRedisUserIndex } from "@/server/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const data = CreateMarketRequest.parse(body);

    // Find users from twitter ids
    let author = await prisma.userProfile.findFirst({
      where: { twitterId: data.author.twitterId },
    });
    let curator = await prisma.userProfile.findFirst({
      where: { twitterId: data.curator.twitterId },
    });

    if (!author || !author.twitterId) {
      author = await prisma.userProfile.create({
        data: {
          twitterId: data.author.twitterId,
          name: data.author.name,
          username: data.author.username,
          image: data.author.avatarUrl,
        },
      });
    }
    await createRedisUserIndex(author);
    console.log('author', author);

    if (!curator || !curator.twitterId) {
      curator = await prisma.userProfile.create({
        data: {
          twitterId: data.curator.twitterId,
          name: data.curator.name,
          username: data.curator.username,
          image: data.curator.avatarUrl,
        },
      });
    }
    await createRedisUserIndex(curator);
    console.log('market curator', curator);

    if (!author.twitterId || !curator.twitterId) {
      return NextResponse.json(
        { message: "Failed to find/create users with twitter ids" },
        { status: 500 }
      );
    }

    // Initialize the pool on-chain and get the data
    const onChainData = await initPool(data.author.twitterId, data.rawMetadataUrl, data.metadata.sourceId);
    if (!onChainData || !onChainData.signature) {
      return NextResponse.json(
        { message: "Failed to create pool" },
        { status: 500 }
      );
    }

    // Create media
    const media = await prisma.media.create({
      data: {
        platform: data.platform,
        imageUrl: data.imageUrl,
        authorId: author.id,
        name: "media",
      },
    });

    // Create market
    const market = await prisma.market.create({
      data: {
        tweetId: data.metadata.sourceId,
        lookupTableAddress: onChainData.lookupTableAddress.toBase58(),
        authorVaultPublicKey: onChainData.authorVaultPublicKey.toBase58(),
        collectionPublicKey: onChainData.collectionPublicKey.toBase58(),
        metadataURL: data.rawMetadataUrl,
        supply: 0,
        buyPrice: 0,
        sellPrice: 0,
        marketCap: 0,
        mediaId: media.id,
        authorId: author.id,
        curatorId: curator.id,
        signature: onChainData.signature,
        metadata: data.metadata,
      },
    });

    // Send the data in response
    return NextResponse.json({
      message: "Successfully created a market",
      market,
      media,
      onChainData,
    });
  } catch (error: any) {
    console.error(error);
    // Check if the error is a ZodError
    if (error instanceof ZodError)
      return NextResponse.json(fromZodError(error));
    // Return others errors directly in response
    return NextResponse.json({ error: error }, { status: 500 });
  }
}