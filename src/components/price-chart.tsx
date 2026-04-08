"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Range = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL"
const ranges: Range[] = ["24H", "7D", "30D", "90D", "1Y", "ALL"]

function genData(range: Range, base: number) {
  const n = range === "24H" ? 48 : range === "7D" ? 56 : range === "30D" ? 30 : range === "90D" ? 90 : range === "1Y" ? 52 : 104
  const out: { label: string; price: number; vol: number }[] = []
  let p = base * (0.85 + Math.random() * 0.1)
  for (let i = 0; i < n; i++) {
    p = Math.max(base * 0.4, p + (Math.random() - 0.48) * base * 0.018)
    const d = new Date()
    if (range === "24H") d.setMinutes(d.getMinutes() - (n - i) * 30)
    else if (range === "7D") d.setHours(d.getHours() - (n - i) * 3)
    else d.setDate(d.getDate() - (n - i))
    out.push({
      label: ["24H", "7D"].includes(range)
        ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: Math.round(p * 100) / 100,
      vol: Math.floor(5000 + Math.random() * 30000),
    })
  }
  return out
}

export function PriceChart({ basePrice, positive }: { basePrice: number; positive: boolean }) {
  const [range, setRange] = useState<Range>("7D")
  const data = useMemo(() => genData(range, basePrice), [range, basePrice])
  const color = positive ? "#10B981" : "#EF4444"

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      {/* Range tabs */}
      <div className="flex items-center gap-0.5 border-b border-border/40 px-4 py-2.5">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Area chart */}
      <div className="px-2 pt-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} minTickGap={60} />
              <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => `$${v}`} width={55} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                      <div className="text-muted-foreground">{d.label}</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">${d.price.toLocaleString("en-US")}</div>
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} fill="url(#areaFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Volume bars */}
        <div className="h-[50px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Bar dataKey="vol" fill="#1E2438" radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
