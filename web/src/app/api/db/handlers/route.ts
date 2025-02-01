// app/api/db/handler/route.ts
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { FillLogResult, PlaceOrderLogResult } from "@/lib/types";
import { OrderType } from "@prisma/client";

const orderTypeMap = {
  0: OrderType.LIMIT,
  1: OrderType.IOC,
  2: OrderType.POST_ONLY,
  3: OrderType.GLOBAL,
} as const;

export async function POST(request: Request) {
  const { data, type } = await request.json();

  try {
    if (type === "fill") {
      const fillData: FillLogResult = data;

      const maybeTrade = await db.trade.findUnique({
        where: {
          signature: fillData.signature,
        },
      });
      if (maybeTrade) {
        console.log("Skipping already processed trade", fillData.signature);
        return NextResponse.json({ success: true });
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
            signature: fillData.signature,
            price: fillData.priceAtoms,
          },
        });
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
            signature: fillData.signature,
            price: fillData.priceAtoms,
          },
        });
      }
    } else if (type === "placeOrder") {
      const orderData: PlaceOrderLogResult = data;
      const maybeOrder = await db.order.findUnique({
        where: {
          signature: orderData.signature,
        },
      });
      if (maybeOrder) {
        console.log("Skipping already processed order", orderData.signature);
        return NextResponse.json({ success: true });
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
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
