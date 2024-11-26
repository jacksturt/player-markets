import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection, PublicKey, Transaction, TransactionConfirmationStatus, TransactionSignature } from "@solana/web3.js";
import { CLUSTER_URL } from "./constants";
import { TransactionInstruction } from "@solana/web3.js";
import {
  AssetV1,
  fetchAssetsByCollection,
  mplCore,
  fetchCollectionV1,
} from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { RarityBalance } from "@/types/queries";
import bs58 from "bs58";
import * as anchor from "@coral-xyz/anchor";
import BangerProgramIDL from "@/lib/on-chain/idl.json";
import { das } from "@metaplex-foundation/mpl-core-das";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";

// Use the RPC endpoint of your choice.
const umi = createUmi(CLUSTER_URL).use(mplCore()).use(dasApi());

/**
 * Retrieves the supply of a collection.
 *
 * @param collectionPublicKey - The public key of the collection to query.
 * @returns A promise that resolves to the supply of the collection.
 */
async function getCollectionSupply(
  collectionPublicKey: PublicKey
): Promise<number> {
  const collection = publicKey(collectionPublicKey);
  //const data = await fetchCollectionV1(umi, collection);
  const data = await das.getCollection(umi, collection);
  return data.currentSize;
}

async function getRarity(address: string): Promise<string | undefined> {
  try {
    const asset = await das.getAsset(umi, publicKey(address));
    const rarity = asset.attributes?.attributeList[0].value;
    return rarity;
  } catch (error) {
    console.log("error", error);
    return undefined;
  }
}

/**
 * Retrieves all token addresses (NFTs) in a collection filtered by a wallet.
 *
 * @param walletPublicKey - The public key of the wallet to query.
 * @param collectionPublicKey - The public key of the collection to filter by.
 * @param rarity - The rarity of the tokens to filter by.
 * @returns A promise that resolves to an array of mint addresses belonging to the specified collection.
 */
async function getTokensByCollection(
  walletPublicKey: PublicKey,
  collectionPublicKey: PublicKey,
  rarity: "common" | "rare" | "epic" | "legendary"
): Promise<PublicKey[]> {
  const assetsByCollection = await fetchAssetsByCollection(
    umi,
    collectionPublicKey.toBase58(),
    {
      skipDerivePlugins: false,
    }
  );
  const walletAssets = assetsByCollection.filter(
    (asset) => asset.owner === walletPublicKey.toBase58()
  );
  console.log("filtering assets by rarity", rarity);
  const filteredAssets = filterTokensByRarity(walletAssets, rarity);
  console.log("filtered assets", filteredAssets);
  return filteredAssets.map((asset) => new PublicKey(asset.publicKey));
}

/**
 * Retrieves the token count of a wallet filtered by a specific collection public key.
 *
 * @param walletPublicKey - The public key of the wallet to query.
 * @param collectionPublicKey - The public key of the collection to filter by.
 * @returns A promise that resolves to the number of tokens per rarity belonging to the wallet of the specified collection.
 */
async function getBangerCountWithRarity(
  walletPublicKey: PublicKey,
  collectionPublicKey: PublicKey
): Promise<RarityBalance> {
  const assetsByCollection = await fetchAssetsByCollection(
    umi,
    collectionPublicKey.toBase58(),
    {
      skipDerivePlugins: false,
    }
  );
  const walletAssets = assetsByCollection.filter(
    (asset) => asset.owner === walletPublicKey.toBase58()
  );
  const rarityBalance: RarityBalance = {
    total: 0,
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  walletAssets.forEach((obj) => {
    const rarityAttribute = obj.attributes?.attributeList.find(
      (attr) => attr.key === "rarity"
    );
    if (rarityAttribute) {
      rarityBalance.total += 1;
      switch (rarityAttribute.value) {
        case "common":
          rarityBalance.common += 1;
          break;
        case "rare":
          rarityBalance.rare += 1;
          break;
        case "epic":
          rarityBalance.epic += 1;
          break;
        case "legendary":
          rarityBalance.legendary += 1;
          break;
        default:
          // Handle unknown rarity if necessary
          break;
      }
    }
  });
  return rarityBalance;
}

// Filter tokens by rarity and return the filtered assets
function filterTokensByRarity(
  assets: AssetV1[],
  filter: "common" | "rare" | "epic" | "legendary"
): AssetV1[] {
  return assets.filter((asset) => {
    const rarityAttribute = asset.attributes?.attributeList.find(
      (attr) => attr.key === "rarity"
    );
    return rarityAttribute?.value === filter;
  });
}

// Serialize and deserialize transaction instructions
function serializeTransactionInstruction(instruction: TransactionInstruction) {
  return {
    programId: instruction.programId.toBase58(),
    data: instruction.data.toString("base64"),
    keys: instruction.keys.map((key) => ({
      pubkey: key.pubkey.toBase58(),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
  };
}

function deserializeTransactionInstruction(obj: any): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(obj.programId),
    data: Buffer.from(obj.data, "base64"),
    keys: obj.keys.map((key: any) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
  });
}

function getPriorityFeeMapping(
  priorityLevel: "Fast" | "Turbo" | "Ultra"
): "Medium" | "High" | "VeryHigh" {
  if (priorityLevel === "Fast") return "Medium";
  if (priorityLevel === "Turbo") return "High";
  return "VeryHigh";
}

async function getPriorityFeeEstimate(
  priorityLevel: string,
  transaction: Transaction | anchor.web3.VersionedTransaction
) {
  console.log("Priority Level: ", priorityLevel);
  const response = await fetch(CLUSTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method: "getPriorityFeeEstimate",
      params: [
        {
          transaction: bs58.encode(
            transaction.serialize({ requireAllSignatures: false })
          ),
          options: { recommended: true },
        },
      ],
    }),
  });

  const data = await response.json();
  console.log(
    "Fee in function for",
    priorityLevel,
    " :",
    data.result.priorityFeeEstimate
  );
  return data.result;
}

async function getLatestBlockchainData(limit: number, before?: string) {
  const connection = new Connection(CLUSTER_URL, "confirmed");
  const bangerProgramId = new PublicKey(BangerProgramIDL.address);

  const options: any = {
    limit: limit,
    commitment: "finalized",
  };
  if (before) {
    options.before = before;
  }

  const signatures = await connection.getSignaturesForAddress(bangerProgramId, options);
  console.log("signatures length", signatures.length);
  const txs = [];

  for (const signature of signatures) {
    const tx = await connection.getTransaction(signature.signature, {
      maxSupportedTransactionVersion: 0
    });
    txs.push(tx);
  }

  return txs;
}

export async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
  confirmLevel: TransactionConfirmationStatus,
) {
  let done = false;

  const confirmLevels: (TransactionConfirmationStatus | null | undefined)[] = [
    'finalized',
  ];

  if (confirmLevel === 'confirmed') {
    confirmLevels.push('confirmed');
  } else if (confirmLevel === 'processed') {
    confirmLevels.push('confirmed');
    confirmLevels.push('processed');
  }
  const result = await new Promise((resolve, reject) => {
    (async () => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        console.log('Timed out for txid', txid);
        reject({ timeout: true });
      }, timeout);
      try {
        connection.onSignature(
          txid,
          (result) => {
            // console.log('WS confirmed', txid, result);
            done = true;
            if (result.err) {
              reject(result.err);
            } else {
              resolve(result);
            }
          },
          'processed',
        );
        // console.log('Set up WS connection', txid);
      } catch (e) {
        done = true;
        console.log('WS error in setup', txid, e);
      }
      while (!done) {
        // eslint-disable-next-line no-loop-func
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            const result = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!result) {
                // console.log('REST null result for', txid, result);
              } else if (result.err) {
                console.log('REST error for', txid, result);
                done = true;
                reject(result.err);
              } else if (
                !(
                  result.confirmations ||
                  confirmLevels.includes(result.confirmationStatus)
                )
              ) {
                console.log('REST not confirmed', txid, result);
              } else {
                console.log('REST confirmed', txid, result);
                done = true;
                resolve(result);
              }
            }
          } catch (e) {
            if (!done) {
              console.log('REST connection error: txid', txid, e);
            }
          }
        })();
        await sleep(300);
      }
    })();
  });

  done = true;
  return result;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export {
  serializeTransactionInstruction,
  deserializeTransactionInstruction,
  getTokensByCollection,
  getBangerCountWithRarity,
  getPriorityFeeEstimate,
  getCollectionSupply,
  getPriorityFeeMapping,
  getLatestBlockchainData,
  getRarity
};