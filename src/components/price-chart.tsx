"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { fetchPriceHistory } from "@/lib/data"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Range = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL"
const ranges: Range[] = ["24H", "7D", "30D", "90D", "1Y", "ALL"]

const rangeToDays: Record<Range, number> = {
  "24H": 1,
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "1Y": 365,
  "ALL": 3650,
}

function formatLabel(dateStr: string, range: Range) {
  const d = new Date(dateStr)
  if (range === "24H" || range === "7D") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface ChartPoint {
  label: string
  price: number
  date: string
}

export function PriceChart({ cardId, positive }: { cardId: string; positive: boolean }) {
  const [range, setRange] = useState<Range>("30D")
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchPriceHistory(cardId, rangeToDays[range]).then((history) => {
      if (cancelled) return
      setData(
        history.map((p) => ({
          label: formatLabel(p.date, range),
          price: p.price,
          date: p.date,
        }))
      )
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [cardId, range])

  const color = positive ? "#10B981" : "#EF4444"
  const hasData = data.length > 0

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
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading price data...
            </div>
          ) : !hasData ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No price history for this period
            </div>
          ) : (
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
                        <div className="text-muted-foreground">{d.date}</div>
                        <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">${d.price.toLocaleString("en-US")}</div>
                      </div>
                    )
                  }}
                />
                <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} fill="url(#areaFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
