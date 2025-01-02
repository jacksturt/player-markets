import MarketFeature from "@/components/web/market-feature";

export default function Page({
  params,
}: {
  params: { marketAddress: string };
}) {
  return <MarketFeature params={params} />;
}
