import { PublicKey } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);

    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }

  return "just now";
}

export function shortenAddress(address: PublicKey | string) {
  if (typeof address === "string") {
    return address.slice(0, 4) + "..." + address.slice(-4);
  }
  return address.toBase58().slice(0, 4) + "..." + address.toBase58().slice(-4);
}

export function quarterNameToBetterString(quarterName: string) {
  if (quarterName === "1") {
    return "1st Quarter";
  }
  if (quarterName === "2") {
    return "2nd Quarter";
  }
  if (quarterName === "3") {
    return "3rd Quarter";
  }
  if (quarterName === "4") {
    return "4th Quarter";
  }
  if (quarterName === "OT") {
    return "Overtime";
  }
  return quarterName;
}

export function quarterNameToNumber(quarterName: string) {
  if (quarterName === "1") {
    return 1;
  }
  if (quarterName === "2") {
    return 2;
  }
  if (quarterName === "3") {
    return 3;
  }
  if (quarterName === "4") {
    return 4;
  }
  if (quarterName === "OT") {
    return 5;
  }
  return 0;
}

export function convertDownAndDistanceToBetterString(
  down: number,
  distance: number
) {
  if (down === 1) {
    return `1st & ${distance} yard${distance === 1 ? "" : "s"}`;
  }
  if (down === 2) {
    return `2nd & ${distance} yard${distance === 1 ? "" : "s"}`;
  }
  if (down === 3) {
    return `3rd & ${distance} yard${distance === 1 ? "" : "s"}`;
  }
  return `4th & ${distance} yard${distance === 1 ? "" : "s"}`;
}

export function getPercentGameRemaining(
  quarter: string,
  minutesRemainingInQuarter: number,
  secondsRemainingInQuarter: number
) {
  const quarterNumber = quarterNameToNumber(quarter);
  console.log("quarterNumber", quarterNumber);
  const totalSecondsRemaining =
    3600 -
    quarterNumber * 900 +
    minutesRemainingInQuarter * 60 +
    secondsRemainingInQuarter;
  const totalSecondsInGame = 3600;
  return totalSecondsRemaining / totalSecondsInGame;
}
