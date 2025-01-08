export interface FillFeedMessage {
  timestamp: number;
  price: number;
  size: number;
  side: "buy" | "sell";
}
