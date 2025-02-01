"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceDataPoint {
  date: number;
  price: number;
}

const TokenPriceChart = ({ data }: { data: PriceDataPoint[] }) => {
  const [timeRange, setTimeRange] = useState("1H");

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              horizontal={true}
              vertical={false}
              stroke="#C9C9C9"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              orientation="right"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [`$${value}`, "Price"]}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="black"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time Range Picker */}
      <div className="flex gap-2 justify-center">
        {["1m", "15m", "1H", "4H", "1D", "ALL"].map((range) => (
          <button
            key={range}
            className={`px-4 py-2 rounded-full text-[10px] text-black 
              ${range === timeRange ? "bg-[#E7E7E7]" : "hover:bg-[#E7E7E7]"}`}
            onClick={() => setTimeRange(range)}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TokenPriceChart;
