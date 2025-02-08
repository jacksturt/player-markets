"use client";
import MarketAdmin from "@/components/web/market-admin";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCurrentMarket } from "@/components/web/market-data-access";
import { useEffect } from "react";

export default function AdminPage({
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
    router.push(`/auth/signin?callbackUrl=/markets/admin/${marketAddress}`);
    return null;
  }

  return <MarketAdmin />;
}
