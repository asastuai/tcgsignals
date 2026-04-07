"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { PricePoint } from "@/lib/types";

interface MiniChartProps {
  data: PricePoint[];
  positive: boolean;
}

export default function MiniChart({ data, positive }: MiniChartProps) {
  const color = positive ? "#00d68f" : "#ff4757";
  const last7 = data.slice(-7);

  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={last7}>
          <defs>
            <linearGradient id={`mini-${positive}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#mini-${positive})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
