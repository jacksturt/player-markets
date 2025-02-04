"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/navbar";
import MarketFeatureNew from "@/components/web/market-feature-new";

export default function MarketPage({
  params,
}: {
  params: { marketAddress: string[] };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const marketAddress = Array.isArray(params.marketAddress)
    ? params.marketAddress[0]
    : params.marketAddress;

  if (!session) {
    router.push(`/auth/signin?callbackUrl=/home/players/${marketAddress}`);
    return null;
  }

  // return <MarketFeature marketAddress={marketAddress} />;
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col gap-5 bg-gradient-to-b from-[#1E1E1E] via-[#050505] to-black pt-5">
      <Navbar />
      <MarketFeatureNew marketAddress={marketAddress} />
    </div>
  );
}
