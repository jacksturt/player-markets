import { PublicKey } from "@solana/web3.js";
import { generateErrorMessage } from "zod-error";
import { twMerge } from "tailwind-merge";
import { ZodError } from "zod";
import { type ClassValue, clsx } from "clsx";
import Decimal from "decimal.js";
import { Market } from "@prisma/client";
import { MarketWithNumbers } from "@/types/queries";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export function getPublicKeyInitials(publicKey: PublicKey) {
  return `${publicKey.toString().slice(0, 4)}...${publicKey
    .toString()
    .slice(-4)}`;
}

export function fromZodError(error: ZodError) {
  return {
    error: {
      code: "unprocessable_entity",
      message: generateErrorMessage(error.issues, {
        maxErrors: 1,
        delimiter: {
          component: ": ",
        },
        path: {
          enabled: true,
          type: "objectNotation",
          label: "",
        },
        code: {
          enabled: true,
          label: "",
        },
        message: {
          enabled: true,
          label: "",
        },
      }),
    },
  };
}

export const calculateFromSupply = (supply: number) => {
  const buyPrice = Math.pow(supply + 1, 2) / 32000;
  const sellPrice = Math.pow(supply, 2) / 32000;
  const marketCap = buyPrice * supply;
  return { buyPrice, sellPrice, marketCap };
};

// Helper function to add WP proxy prefix
export function addWPProxy(url: string): string {
  if (!url) return url;
  // Skip if already using wp proxy
  if (url.startsWith("https://i0.wp.com/")) return url;
  return `https://i0.wp.com/${url.replace(/^https?:\/\//, "")}`;
}

export function higherResImage(url: string | null): string | null {
  if (!url) return null;
  const regex = /^https:\/\/pbs\.twimg\.com\/profile_images\/.+_normal\.jpg$/;

  // First convert to higher res version
  let higherResUrl = url;
  if (regex.test(url)) {
    higherResUrl = url.replace("_normal.jpg", "_400x400.jpg");
  }

  // Then add WP proxy
  return addWPProxy(higherResUrl);
}

// Function to get fallback avatar URL using Boring Avatars
export function getFallbackAvatarUrl(username: string): string {
  return `https://source.boringavatars.com/beam/120/${encodeURIComponent(
    username
  )}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
}

// Function to calculate total price for given starting supply s
export function calculateTotalPrice(
  startingSupply: Decimal,
  numAssets: Decimal,
  type: "mint" | "burn"
): Decimal {
  let totalPrice = new Decimal(0);
  for (let i = new Decimal(0); i.lt(numAssets); i = i.plus(1)) {
    if (type === "mint") {
      totalPrice = totalPrice.add(
        startingSupply.plus(i).plus(1).pow(2).div(32000)
      );
    } else {
      totalPrice = totalPrice.add(startingSupply.minus(i).pow(2).div(32000));
    }
  }
  return totalPrice;
}

// Function to find the starting supply
export function findStartingSupply(
  totalPrice: Decimal,
  numAssets: Decimal,
  type: "mint" | "burn"
): Decimal {
  let startingSupply = new Decimal(0);
  while (calculateTotalPrice(startingSupply, numAssets, type).lt(totalPrice)) {
    startingSupply = startingSupply.plus(1);
  }
  return startingSupply;
}


export function formatMarket(market: Market): MarketWithNumbers {
  return {
    ...market,
    buyPrice: Number(market.buyPrice),
    sellPrice: Number(market.sellPrice),
    marketCap: Number(market.marketCap)
  }
}