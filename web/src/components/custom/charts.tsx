import React, { PureComponent } from "react";
import TimeAgo from "javascript-time-ago";
import en from 'javascript-time-ago/locale/en';
import {
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { calculateFromSupply } from "@/lib/utils";
import { format } from 'date-fns';

// Modify the component to accept trades data as a prop
interface MarketChartProps {
  trades: {
    time: Date;
    amount: number;
    totalValue: number;
    supplyAfterTrade: number;
  }[];
}

// Add locale-specific relative date/time formatting rules.
TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US');

export default class MarketChart extends PureComponent<MarketChartProps> {
  // Process trades data to fit the chart format
  processTradesData(trades: MarketChartProps["trades"]) {
    const sortedTrades = [...trades].sort((a, b) => a.time.getTime() - b.time.getTime());
    const firstTradeTime = sortedTrades[0].time.getTime();
    const currentTime = new Date().getTime();

    console.log("trades", trades);

    return [
      {
        time: firstTradeTime,
        price: calculateFromSupply(sortedTrades[0].supplyAfterTrade).buyPrice,
      },
      ...sortedTrades.map((trade) => ({
        time: trade.time.getTime(),
        price: calculateFromSupply(trade.supplyAfterTrade).buyPrice,
      })),
      {
        time: currentTime,
        price: calculateFromSupply(sortedTrades[sortedTrades.length - 1].supplyAfterTrade).buyPrice,
      },
    ];
  }

  render() {
    const data = this.processTradesData(this.props.trades);
    const timeRange = data[data.length - 1].time - data[0].time;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 15,
            right: 25,
            left: -5,
            bottom: 15,
          }}
        >
          <defs>
            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2E5CF1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#2E5CF1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={[
              data[0].time,
              data[0].time + timeRange * 0.25,
              data[0].time + timeRange * 0.5,
              data[0].time + timeRange * 0.75,
              data[data.length - 1].time,
            ]}
            tick={{ fontSize: 12, width: 80, dy: 5 }}
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return `${format(date, 'MMM dd')}\n${format(date, 'HH:mm')}`;
            }}
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            interval={0}
            tick={{ fontSize: 14 }}
            axisLine={false}
            tickLine={false}
            dataKey={"price"}
            tickFormatter={(value) => value.toFixed(3)}
          />
          <CartesianGrid vertical={false} />
          <Tooltip
            labelStyle={{ color: "black" }}
            labelFormatter={(value) => new Date(value).toLocaleString()}
          />
          <Area
            type="linear"
            dataKey="price"
            stroke="#81F052"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPv)"
            name="Price"
            radius={0}
            stackId={"1"}
            isAnimationActive={true}
          />
          {/* <Area type="monotone" dataKey="pv" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPv)" /> */}
        </AreaChart>
      </ResponsiveContainer>
    );
  }
}

export { MarketChart };
