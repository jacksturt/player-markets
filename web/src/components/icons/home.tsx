import React from "react";

interface HomeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  gradient?: boolean;
  gradientStart?: string;
  gradientEnd?: string;
}

export default function HomeIcon({
  size = 20,
  gradient = false,
  gradientStart,
  gradientEnd,
  ...props
}: HomeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 71 66"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient id="homeGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
        </defs>
      )}
      <path
        d="M39.7334 1.43508C37.496 -0.407397 33.9961 -0.407397 31.7587 1.43508L3.6472 24.5847C1.90787 26.017 0.922363 28.0099 0.922363 30.0947V58.2485C0.922363 62.4362 4.82012 65.8313 9.62829 65.8313H18.3342C23.1424 65.8313 27.0401 62.4362 27.0401 58.2485V45.6104C27.0401 44.2146 28.3394 43.083 29.9421 43.083H41.55C43.1527 43.083 44.452 44.2146 44.452 45.6104V58.2485C44.452 62.4362 48.3499 65.8313 53.1579 65.8313H61.8638C66.6718 65.8313 70.5698 62.4362 70.5698 58.2485V30.0947C70.5698 28.0099 69.5843 26.017 67.8448 24.5847L39.7334 1.43508Z"
        fill={
          gradient && gradientStart && gradientEnd
            ? "url(#homeGradient)"
            : "white"
        }
      />
    </svg>
  );
}
