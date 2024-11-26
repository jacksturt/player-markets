"use server";
import prisma from "../db";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { PublicKey} from "@solana/web3.js";
import { CLUSTER_URL } from "./constants";
import {
  fetchAssetsByCollection,
  mplCore
} from "@metaplex-foundation/mpl-core";

// Use the RPC endpoint of your choice.
const umi = createUmi(CLUSTER_URL).use(mplCore());

/**
 * Refreshes all tokens details (NFTs) in a collection filtered by a wallet in the db.
 *
 * @param walletPublicKey - The public key of the wallet to query.
 * @param collectionPublicKey - The public key of the collection to filter by.
 * @returns A promise that resolves to an array of mint addresses belonging to the specified collection.
 */
async function refreshBangerRarities(
  walletPublicKey: string,
  collectionPublicKey: string,
) {
  const assetsByCollection = await fetchAssetsByCollection(
    umi,
    collectionPublicKey,
    {
      skipDerivePlugins: false,
    }
  );
  const walletAssets = assetsByCollection.filter(
    (asset) => asset.owner === walletPublicKey
  );
  const walletAssetKeys = walletAssets.map((asset) => new PublicKey(asset.publicKey).toBase58());

  // Find Banger IDs from the database
  const savedBangers = await prisma.banger.findMany({
    where: {
      address: {
        in: walletAssetKeys,
      },
      rarity: null,
    },
    select: {
      id: true,
      address: true,
    }
  });

  // Create a map of addresses to banger IDs
  const addressToBangerId = new Map(savedBangers.map(banger => [banger.address, banger.id]));

  const updateOperations = walletAssets.map(asset => {
    const rarity = asset.attributes?.attributeList.find(attr => attr.key === 'rarity')?.value;
    const assetAddress = new PublicKey(asset.publicKey).toBase58();
    const bangerId = addressToBangerId.get(assetAddress);
    if (!rarity || !bangerId) return null;
    return prisma.banger.update({
      where: {
        id: bangerId,
        rarity: null,
      },
      data: {
        rarity: rarity,
      },
    });
  }).filter(operation => operation !== null);

  await prisma.$transaction(updateOperations as any[]);
  console.log("Updated rarities");
}

export { refreshBangerRarities };