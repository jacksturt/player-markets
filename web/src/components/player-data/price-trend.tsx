import TrendUp from "../icons/trend-up";
import TrendDown from "../icons/trend-down";

export default function PriceTrend({
  playerData,
}: {
  playerData: { pctChange: number };
}) {
  return (
    <div
      className={`flex items-center gap-1 py-1 px-2 rounded-xl ${
        playerData.pctChange > 0 ? "bg-accent" : "bg-[#FFE5E5]"
      }`}
    >
      {playerData.pctChange > 0 ? (
        <TrendUp size={16} />
      ) : (
        <TrendDown size={16} />
      )}
      <p
        className={`text-sm ${
          playerData.pctChange > 0 ? "text-accent-foreground" : "text-[#F57272]"
        }`}
      >
        {playerData.pctChange.toFixed(1)}%
      </p>
    </div>
  );
}
