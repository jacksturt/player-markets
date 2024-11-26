// src/app/api/solana-price/route.ts
import { NextResponse } from "next/server";

let cachedPrice: number | null = null;
let lastFetch = 0;

export async function GET() {
  try {
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    // Return cached price if less than 5 minutes old
    if (cachedPrice && now - lastFetch < FIVE_MINUTES) {
      return NextResponse.json({ solana: { usd: cachedPrice } });
    }

    // Fetch new price only if cache is old or empty
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 }, // 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from CoinGecko");
    }

    const data = await response.json();

    // Update cache
    cachedPrice = data.solana.usd;
    lastFetch = now;

    return NextResponse.json(data);
  } catch {
    // If we have a cached price, return it even if it's old
    if (cachedPrice) {
      return NextResponse.json({
        solana: { usd: cachedPrice },
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch SOL price" },
      { status: 500 }
    );
  }
}
