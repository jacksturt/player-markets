export default function TrendUpIcon({
  size,
  color = "#39DE5A",
  gradient = false,
  gradientStart = "#F92D37",
  gradientEnd = "#F9D10A",
}: {
  size: number;
  color?: string;
  gradient?: boolean;
  gradientStart?: string;
  gradientEnd?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 45 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {gradientStart && gradientEnd && gradient && (
        <defs>
          <linearGradient id="trendUpGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
        </defs>
      )}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M33.4148 1.02373C37.0121 0.262674 40.1723 0.270999 41.6723 0.335522C43.0023 0.392714 44.0585 1.48206 44.1139 2.85362C44.1765 4.40072 44.1846 7.65984 43.4467 11.3699C43.0113 13.5585 40.4604 14.1516 39.0529 12.7001L37.0229 10.6064C36.4213 11.1672 35.6083 11.9375 34.6779 12.8517C32.6752 14.8194 30.1622 17.4205 28.0431 20.0171C26.2401 22.2261 22.7813 22.2108 21.0881 19.7669C20.1779 18.4533 18.9956 16.8011 17.7541 15.2102C15.3876 16.8806 10.4741 20.7251 4.95058 27.2395C4.6082 27.6434 4.26348 28.0575 3.91688 28.4819C3.16314 29.4049 1.8266 29.523 0.931636 28.7456C0.0366687 27.9682 -0.0778214 26.5898 0.675919 25.6669C1.03957 25.2215 1.40137 24.787 1.76084 24.363C7.68167 17.3798 12.9748 13.2717 15.524 11.4893C17.3071 10.2426 19.6459 10.6723 20.9536 12.3407C22.3014 14.06 23.5743 15.8388 24.5356 17.2263C24.5447 17.2393 24.5519 17.2451 24.5626 17.2508C24.5769 17.2582 24.6034 17.2674 24.6405 17.2685C24.7203 17.2708 24.7727 17.238 24.8014 17.2029C27.0636 14.4311 29.7019 11.7052 31.7552 9.68776C32.6375 8.82088 33.418 8.07874 34.0231 7.51265L32.125 5.55512C30.7176 4.10359 31.2927 1.4727 33.4148 1.02373Z"
        fill={
          gradientStart && gradientEnd && gradient
            ? "url(#trendUpGradient)"
            : color
        }
      />
    </svg>
  );
}
