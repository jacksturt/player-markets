import { PlayerProjection } from "@/lib/types/sportsdata";
import { db } from "@/server/db";
import { program } from "@coral-xyz/anchor/dist/cjs/native/system";
import { ConfirmedSignatureInfo, Connection, PublicKey } from "@solana/web3.js";
import { getTradetalkProgram, getTradetalkProgramId } from "@project/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { EnvWallet } from "@/lib/envWallet";
import { FillLog, PlaceOrderLog, PROGRAM_ID } from "manifest/src/manifest";
import keccak256 from "keccak256";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { PlaceOrderLogResult } from "@/lib/types/manifest";
import { FillLogResult } from "@/lib/types/manifest";
import { convertU128 } from "manifest/src/utils/numbers";
import { Market, Mint, OrderType, Player, Team } from "@prisma/client";

export async function checkOrdersAndFills(marketAddress: string) {
  const market = await db.market.findUnique({
    where: {
      address: marketAddress,
    },
    include: {
      baseMint: true,
      player: true,
      team: true,
    },
  });
  const lastSignature = market?.lastSignature;

  if (!process.env.RPC_URL) {
    throw new Error("RPC_URL not found");
  }

  if (!market) {
    throw new Error("Market not found");
  }

  try {
    const connection = new Connection(process.env.RPC_URL);
    const params = lastSignature
      ? {
          until: lastSignature,
          limit: 10,
        }
      : {
          limit: 10,
        };
    const signatures: ConfirmedSignatureInfo[] =
      await connection.getSignaturesForAddress(
        new PublicKey(marketAddress),
        params,
        "finalized"
      );
    console.log("Got", signatures.length, "signatures", signatures);

    signatures.reverse();

    // If there is only 1, do not use it because it could get stuck on the same sig.
    if (signatures.length <= 0) {
      return;
    }
    const handleSignaturesPromiseArray = signatures.map(
      async (marketAddressAndSignature) => {
        await handleSignature(marketAddressAndSignature, market);
      }
    );

    await Promise.all(handleSignaturesPromiseArray);

    return true;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

const orderTypeMap = {
  0: OrderType.LIMIT,
  1: OrderType.IOC,
  2: OrderType.POST_ONLY,
  3: OrderType.GLOBAL,
} as const;

function genAccDiscriminator(accName: string) {
  return keccak256(
    Buffer.concat([
      Buffer.from(bs58.decode(PROGRAM_ID.toBase58())),
      Buffer.from(accName),
    ])
  ).subarray(0, 8);
}

async function handleSignature(
  signature: ConfirmedSignatureInfo,
  market: Market & {
    player: Player | null;
    team: Team | null;
    baseMint: Mint;
  }
) {
  console.log("Handling", signature.signature, "slot", signature.slot);
  const connection = new Connection(process.env.RPC_URL!);
  const tx = await connection.getTransaction(signature.signature, {
    maxSupportedTransactionVersion: 0,
  });
  if (!tx?.meta?.logMessages) {
    console.log("No log messages");
    return;
  }
  if (tx.meta.err != null) {
    console.log("Skipping failed tx", signature.signature);
    return;
  }

  const messages: string[] = tx?.meta?.logMessages!;
  const programDatas: string[] = messages.filter((message) => {
    return message.includes("Program data:");
  });

  if (programDatas.length == 0) {
    console.log("No program datas");
    return;
  }

  for (const programDataEntry of programDatas) {
    const programData = programDataEntry.split(" ")[2];
    const byteArray: Uint8Array = Uint8Array.from(atob(programData), (c) =>
      c.charCodeAt(0)
    );
    const buffer = Buffer.from(byteArray);
    console.log("buffer", buffer);
    if (buffer.subarray(0, 8).equals(fillDiscriminant)) {
      const maybeTrade = await db.trade.findUnique({
        where: {
          signature: signature.signature,
        },
      });
      if (maybeTrade) {
        console.log("Skipping already processed trade", signature.signature);
        return;
      }
      const deserializedFillLog: FillLog = FillLog.deserialize(
        buffer.subarray(8)
      )[0];
      const fillData = toFillLogResult(
        deserializedFillLog,
        signature.slot,
        signature.signature
      );
      console.log("Got a fill", fillData);

      const makerWallet = await db.wallet.findFirst({
        where: {
          address: fillData.maker,
        },
        include: {
          user: true,
        },
      });

      if (!makerWallet) {
        throw new Error("Maker wallet not found");
      }

      const takerWallet = await db.wallet.findFirst({
        where: {
          address: fillData.taker,
        },
        include: {
          user: true,
        },
      });

      if (!takerWallet) {
        throw new Error("Taker wallet not found");
      }

      const makerOrder = await db.order.findFirst({
        where: {
          marketId: market?.id,
          sequenceNumber: parseInt(fillData.makerSequenceNumber),
          userId: makerWallet?.user.id,
        },
      });

      if (!makerOrder) {
        console.warn("Maker order not found");
      }

      const takerOrder = await db.order.findFirst({
        where: {
          marketId: market?.id,
          sequenceNumber: parseInt(fillData.takerSequenceNumber),
          userId: takerWallet?.user.id,
        },
      });

      if (!takerOrder) {
        console.warn("Taker order not found");
      }
      if (market.player) {
        const buyAndSellData = fillData.takerIsBuy
          ? {
              buyOrderId: takerOrder?.id,
              buyerId: takerWallet?.user.id,
              buyerWalletId: takerWallet?.id,
              sellOrderId: makerOrder?.id,
              sellerId: makerWallet?.user.id,
              sellerWalletId: makerWallet?.id,
            }
          : {
              buyOrderId: makerOrder?.id,
              buyerId: makerWallet?.user.id,
              buyerWalletId: makerWallet?.id,
              sellOrderId: takerOrder?.id,
              sellerId: takerWallet?.user.id,
              sellerWalletId: takerWallet?.id,
            };
        const trade = await db.trade.create({
          data: {
            marketId: market?.id,
            baseMintId: market?.baseMint.id,
            playerId: market?.player.id,
            signature: signature.signature,
            price: fillData.priceAtoms,
            ...buyAndSellData,
          },
        });
        console.log("Created trade", trade);
      } else if (market.team) {
        const buyAndSellData = fillData.takerIsBuy
          ? {
              buyOrderId: takerOrder?.id,
              buyerId: takerWallet?.user.id,
              buyerWalletId: takerWallet?.id,
              sellOrderId: makerOrder?.id,
              sellerId: makerWallet?.user.id,
              sellerWalletId: makerWallet?.id,
            }
          : {
              buyOrderId: makerOrder?.id,
              buyerId: makerWallet?.user.id,
              buyerWalletId: makerWallet?.id,
              sellOrderId: takerOrder?.id,
              sellerId: takerWallet?.user.id,
              sellerWalletId: takerWallet?.id,
            };
        const trade = await db.trade.create({
          data: {
            marketId: market?.id,
            baseMintId: market?.baseMint.id,
            teamId: market?.team.id,
            signature: signature.signature,
            price: fillData.priceAtoms,
            ...buyAndSellData,
          },
        });
        console.log("Created trade", trade);
      }

      await db.market.update({
        where: {
          id: market?.id,
        },
        data: {
          lastTradePrice: fillData.priceAtoms,
          lastSlot: signature.slot,
          lastSignature: signature.signature,
        },
      });
    } else if (buffer.subarray(0, 8).equals(placeOrderDiscriminant)) {
      const maybeOrder = await db.order.findUnique({
        where: {
          signature: signature.signature,
        },
      });
      if (maybeOrder?.sequenceNumber) {
        console.log("Skipping already processed order", signature.signature);
        continue;
      }
      const deserializedPlaceOrderLog: PlaceOrderLog =
        PlaceOrderLog.deserialize(buffer.subarray(8))[0];
      const orderData = toPlaceOrderLogResult(
        deserializedPlaceOrderLog,
        signature.slot,
        signature.signature
      );
      console.log("Got an order", orderData);

      const wallet = await db.wallet.findFirst({
        where: {
          address: orderData.trader,
        },
        include: {
          user: true,
        },
      });

      const order = await db.order.update({
        where: {
          id: maybeOrder?.id,
        },
        data: {
          sequenceNumber: parseInt(orderData.orderSequenceNumber),
        },
      });
      await db.market.update({
        where: {
          id: market?.id,
        },
        data: {
          lastSlot: signature.slot,
          lastSignature: signature.signature,
        },
      });
    } else {
      continue;
    }
  }
}

const fillDiscriminant = genAccDiscriminator("manifest::logs::FillLog");

function toFillLogResult(
  fillLog: FillLog,
  slot: number,
  signature: string
): FillLogResult {
  return {
    market: fillLog.market.toBase58(),
    maker: fillLog.maker.toBase58(),
    taker: fillLog.taker.toBase58(),
    baseAtoms: fillLog.baseAtoms.inner.toString(),
    quoteAtoms: fillLog.quoteAtoms.inner.toString(),
    priceAtoms: convertU128(fillLog.price.inner),
    takerIsBuy: fillLog.takerIsBuy,
    isMakerGlobal: fillLog.isMakerGlobal,
    makerSequenceNumber: fillLog.makerSequenceNumber.toString(),
    takerSequenceNumber: fillLog.takerSequenceNumber.toString(),
    signature,
    slot,
  };
}

const placeOrderDiscriminant = genAccDiscriminator(
  "manifest::logs::PlaceOrderLog"
);

function toPlaceOrderLogResult(
  placeOrderLog: PlaceOrderLog,
  slot: number,
  signature: string
): PlaceOrderLogResult {
  return {
    market: placeOrderLog.market.toBase58(),
    trader: placeOrderLog.trader.toBase58(),
    baseAtoms: placeOrderLog.baseAtoms.inner.toString(),
    price: convertU128(placeOrderLog.price.inner),
    orderSequenceNumber: placeOrderLog.orderSequenceNumber.toString(),
    orderIndex: placeOrderLog.orderIndex,
    lastValidSlot: placeOrderLog.lastValidSlot,
    orderType: placeOrderLog.orderType,
    isBid: placeOrderLog.isBid,
    padding: placeOrderLog.padding,
    signature,
    slot,
  };
}
