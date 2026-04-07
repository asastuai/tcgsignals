"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PricePoint } from "@/lib/types";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

interface PriceChartProps {
  data: PricePoint[];
  color?: string;
}

export default function PriceChart({ data, color = "#6c5ce7" }: PriceChartProps) {
  const [range, setRange] = useState<number>(30);

  const filtered = data.slice(-range);
  const first = filtered[0]?.price ?? 0;
  const last = filtered[filtered.length - 1]?.price ?? 0;
  const isPositive = last >= first;
  const chartColor = isPositive ? "#00d68f" : "#ff4757";

  return (
    <div className="rounded-xl bg-bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary">
          Evolucion de precio
        </h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                range === r.days
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-muted hover:text-text-secondary"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filtered}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(42,42,69,0.5)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#5c5c7a", fontSize: 11 }}
            tickFormatter={(d) => {
              const date = new Date(d);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#5c5c7a", fontSize: 11 }}
            tickFormatter={(v) => `$${v}`}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a2e",
              border: "1px solid #2a2a45",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#9898b0" }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Precio"]}
            labelFormatter={(label) => {
              const d = new Date(label);
              return d.toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            strokeWidth={2}
            fill="url(#priceGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
