import { PlayerProjection } from "@/lib/types/sportsdata";
import { db } from "@/server/db";
import { program } from "@coral-xyz/anchor/dist/cjs/native/system";
import { ConfirmedSignatureInfo, Connection, PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getTradetalkProgram, getTradetalkProgramId } from "@project/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { EnvWallet } from "@/lib/envWallet";
import { FillLog, PlaceOrderLog, PROGRAM_ID } from "manifest/src/manifest";
import keccak256 from "keccak256";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { PlaceOrderLogResult } from "@/lib/types/manifest";
import { FillLogResult } from "@/lib/types/manifest";
import { convertU128 } from "manifest/src/utils/numbers";
import { OrderType } from "@prisma/client";

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

export async function GET(request: Request) {
  if (
    request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const lastSignature = await db.keyValue.findUnique({
    where: {
      key: "lastSignature",
    },
  });

  const lastSlot = parseInt(
    (
      await db.keyValue.findUnique({
        where: {
          key: "lastSlot",
        },
      })
    )?.value ?? "0"
  );

  if (!process.env.RPC_URL) {
    return NextResponse.json(
      { success: false, error: "RPC_URL not found" },
      { status: 404 }
    );
  }

  if (!lastSignature) {
    return NextResponse.json(
      { success: false, error: "Last signature not found" },
      { status: 404 }
    );
  }

  if (!lastSlot) {
    return NextResponse.json(
      { success: false, error: "Last slot not found" },
      { status: 404 }
    );
  }

  try {
    const connection = new Connection(process.env.RPC_URL);
    const signatures: ConfirmedSignatureInfo[] =
      await connection.getSignaturesForAddress(
        PROGRAM_ID,
        {
          until: lastSignature.value,
        },
        "finalized"
      );
    console.log("Got", signatures.length, "signatures", signatures);

    signatures.reverse();

    // If there is only 1, do not use it because it could get stuck on the same sig.
    if (signatures.length <= 0) {
      return NextResponse.json({ success: true });
    }
    const marketAddresses = (
      await db.market.findMany({
        select: {
          address: true,
        },
      })
    ).map((market) => market.address);
    const handleSignaturesPromiseArray = signatures.map((signature) =>
      handleSignature(signature, marketAddresses)
    );

    await Promise.all(handleSignaturesPromiseArray);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function handleSignature(
  signature: ConfirmedSignatureInfo,
  marketAddresses: string[]
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

      if (!marketAddresses.includes(fillData.market)) {
        console.log("Skipping fill for non-trade-talk market", fillData.market);
        continue;
      }

      const market = await db.market.findFirst({
        where: {
          address: fillData.market,
        },
        include: {
          baseMint: true,
          player: true,
          team: true,
        },
      });

      if (!market) {
        throw new Error("Market not found");
      }

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
        const trade = await db.trade.create({
          data: {
            marketId: market?.id,
            baseMintId: market?.baseMint.id,
            playerId: market?.player.id,
            buyOrderId: makerOrder?.id,
            buyerId: makerWallet?.user.id,
            buyerWalletId: makerWallet?.id,
            sellOrderId: takerOrder?.id,
            sellerId: takerWallet?.user.id,
            sellerWalletId: takerWallet?.id,
            signature: signature.signature,
            price: fillData.priceAtoms,
          },
        });
        console.log("Created trade", trade);
      } else if (market.team) {
        const trade = await db.trade.create({
          data: {
            marketId: market?.id,
            baseMintId: market?.baseMint.id,
            teamId: market?.team.id,
            buyOrderId: makerOrder?.id,
            buyerId: makerWallet?.user.id,
            buyerWalletId: makerWallet?.id,
            sellOrderId: takerOrder?.id,
            sellerId: takerWallet?.user.id,
            sellerWalletId: takerWallet?.id,
            signature: signature.signature,
            price: fillData.priceAtoms,
          },
        });
        console.log("Created trade", trade);
      }
    } else if (buffer.subarray(0, 8).equals(placeOrderDiscriminant)) {
      const maybeOrder = await db.order.findUnique({
        where: {
          signature: signature.signature,
        },
      });
      if (maybeOrder) {
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

      if (!marketAddresses.includes(orderData.market)) {
        console.log(
          "Skipping order for non-trade-talk market",
          orderData.market
        );
        continue;
      }

      const wallet = await db.wallet.findFirst({
        where: {
          address: orderData.trader,
        },
        include: {
          user: true,
        },
      });

      const market = await db.market.findFirst({
        where: {
          address: orderData.market,
        },
        include: {
          baseMint: true,
        },
      });

      const numBaseTokens = parseInt(orderData.baseAtoms);

      const order = await db.order.create({
        data: {
          type: orderTypeMap[orderData.orderType as keyof typeof orderTypeMap],
          price: orderData.price,
          isBid: orderData.isBid,
          numBaseTokens: numBaseTokens,
          numQuoteTokens: numBaseTokens * orderData.price,
          sequenceNumber: parseInt(orderData.orderSequenceNumber),
          signature: orderData.signature,
          baseMint: {
            connect: {
              id: market?.baseMint.id,
            },
          },
          user: {
            connect: {
              id: wallet?.user.id,
            },
          },
          market: {
            connect: {
              id: market?.id,
            },
          },
        },
      });
    } else {
      continue;
    }
    await db.keyValue.update({
      where: {
        key: "lastSlot",
      },
      data: {
        value: signature.slot.toString(),
      },
    });
    await db.keyValue.update({
      where: {
        key: "lastSignature",
      },
      data: {
        value: signature.signature,
      },
    });
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
