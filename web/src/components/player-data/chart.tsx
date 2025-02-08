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
  const [timeRange, setTimeRange] = useState("1D");

  // Sort data by timestamp to ensure proper ordering
  const sortedData = [...data].sort((a, b) => a.date - b.date);
  return (
    <div className="flex flex-col w-full gap-4">
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sortedData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              horizontal={true}
              vertical={false}
              stroke="#C9C9C9"
            />
            <XAxis
              dataKey="date"
              type="number"
              domain={["auto", "auto"]}
              scale="time"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
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
              domain={["auto", "auto"]}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              contentStyle={{
                backgroundColor: "#1E1E1E",
                borderRadius: "10px",
                border: "1px solid #353535",
              }}
              labelFormatter={(label: number) =>
                new Date(label).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#FFFFFF"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time Range Picker */}
    </div>
  );
};

export default TokenPriceChart;
