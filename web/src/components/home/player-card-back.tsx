import React from "react";
import { usePlayerMarketCardStore } from "@/lib/zustand";
import { Trade2 } from "../web/web-ui";

export default function PlayerCardBack() {
  const { selectedOrderType, activePlayerMarket } = usePlayerMarketCardStore();

  return <Trade2 />;
}
