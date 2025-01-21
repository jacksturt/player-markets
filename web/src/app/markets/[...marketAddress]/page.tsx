import MarketFeature from "@/components/web/market-feature";
import { PublicKey } from "@solana/web3.js";

export default function Page({
  params,
}: {
  params: { marketAddress: string | string[] };
}) {
  const marketAddress =
    typeof params.marketAddress === "string"
      ? params.marketAddress
      : params.marketAddress[0];
  if (!marketAddress || marketAddress === "index.iife.min.js.map") {
    return <div>No market address</div>;
  }
  try {
    const marketAddressCheck = new PublicKey(marketAddress);
    return <MarketFeature marketAddress={marketAddressCheck.toString()} />;
  } catch (e) {
    return <div>No market address</div>;
  }
}
