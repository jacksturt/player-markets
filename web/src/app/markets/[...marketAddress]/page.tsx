"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MarketFeature from "@/components/web/market-feature";
import { useCurrentMarket } from "@/components/web/market-data-access";
import { useEffect } from "react";

export default function MarketPage({
  params,
}: {
  params: { marketAddress: string[] };
}) {
  const { data: session } = useSession();
  const { setMarketAddress } = useCurrentMarket();
  const router = useRouter();
  const marketAddress = Array.isArray(params.marketAddress)
    ? params.marketAddress[0]
    : params.marketAddress;

  useEffect(() => {
    setMarketAddress(marketAddress);
  }, [marketAddress]);

  if (!session) {
    router.push(`/auth/signin?callbackUrl=/markets/${marketAddress}`);
    return null;
  }

  return <MarketFeature />;
}
