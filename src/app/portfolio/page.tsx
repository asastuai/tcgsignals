"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sparkline } from "@/components/sparkline"
import { cards, getTcgColor, type CardData } from "@/lib/data"
import { fmtUsd, fmtPct, cn } from "@/lib/utils"
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Plus, Search, TrendingUp, Layers, FolderOpen, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

/* ─── Mock portfolio state ─── */
const portfolioCards = cards.slice(0, 8)

interface Holding {
  card: CardData
  qty: number
  avgCost: number
}

const holdings: Holding[] = portfolioCards.map((c, i) => ({
  card: c,
  qty: [2, 4, 1, 1, 3, 2, 1, 2][i] ?? 1,
  avgCost: c.price * (0.6 + Math.random() * 0.25),
}))

const withValues = holdings.map((h) => {
  const currentValue = h.qty * h.card.price
  const totalCost = h.qty * h.avgCost
  return {
    ...h,
    currentValue,
    totalCost,
    pl: currentValue - totalCost,
    plPct: ((h.card.price - h.avgCost) / h.avgCost) * 100,
  }
})

const portfolioValue = withValues.reduce((s, h) => s + h.currentValue, 0)
const totalCost = withValues.reduce((s, h) => s + h.totalCost, 0)
const totalPl = portfolioValue - totalCost
const totalPlPct = (totalPl / totalCost) * 100

// Value chart
const chartData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: portfolioValue * (0.88 + Math.random() * 0.06 + i * 0.004),
  }
})

// Allocation by TCG
const tcgAlloc = Object.entries(
  withValues.reduce<Record<string, number>>((acc, h) => {
    acc[h.card.tcg] = (acc[h.card.tcg] ?? 0) + h.currentValue
    return acc
  }, {})
)
  .map(([name, value]) => ({ name, value: Math.round((value / portfolioValue) * 100), color: getTcgColor(name) }))
  .sort((a, b) => b.value - a.value)

export default function PortfolioPage() {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return withValues
    const q = search.toLowerCase()
    return withValues.filter((h) => h.card.name.toLowerCase().includes(q) || h.card.set.toLowerCase().includes(q))
  }, [search])

  const totalCards = holdings.reduce((s, h) => s + h.qty, 0)
  const uniqueSets = new Set(holdings.map((h) => h.card.set)).size
  const best = [...withValues].sort((a, b) => b.plPct - a.plPct)[0]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Portfolio</h1>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-4xl font-bold text-foreground">{fmtUsd(portfolioValue)}</span>
            <span className={cn("text-sm font-medium", totalPl >= 0 ? "text-success" : "text-destructive")}>
              {totalPl >= 0 ? "+" : ""}{fmtUsd(totalPl)} ({fmtPct(totalPlPct)}) all-time
            </span>
          </div>
        </div>

        {/* Mini area chart */}
        <div className="mb-8 rounded-xl border border-border/60 bg-card p-3">
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pfG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} minTickGap={50} />
                <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} width={48} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-1.5 text-xs shadow-lg">
                        <span className="font-mono font-semibold text-foreground">${Number(payload[0].value).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                      </div>
                    )
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={1.5} fill="url(#pfG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: Layers, label: "Total Cards", value: String(totalCards) },
            { icon: FolderOpen, label: "Unique Sets", value: String(uniqueSets) },
            { icon: Trophy, label: "Best Performer", value: best ? `${best.card.name.slice(0, 14)}... ${fmtPct(best.plPct)}` : "-" },
            { icon: TrendingUp, label: "Total P&L", value: `${totalPl >= 0 ? "+" : ""}${fmtUsd(totalPl)}` },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3.5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
                <div className="truncate text-sm font-semibold text-foreground">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Allocation + Holdings */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Allocation donut */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Allocation by TCG</h3>
            <div className="flex items-center gap-4">
              <div className="h-[140px] w-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tcgAlloc} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                      {tcgAlloc.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                {tcgAlloc.map((a) => (
                  <div key={a.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="text-foreground">{a.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{a.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Holdings table */}
          <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Holdings</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-40 rounded-md border border-border/60 bg-secondary/40 pl-8 pr-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <Button size="sm" className="h-8 gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> Add</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/20 text-left">
                    <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Card</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Price</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Value</th>
                    <th className="hidden px-4 py-2.5 text-right text-xs font-medium text-muted-foreground sm:table-cell">P&L</th>
                    <th className="hidden px-4 py-2.5 sm:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h) => (
                    <tr key={h.card.id} className="border-b border-border/20 transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-2.5">
                        <Link href={`/card/${h.card.id}`} className="flex items-center gap-2">
                          <div className="h-8 w-6 shrink-0 rounded bg-secondary" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">{h.card.name}</div>
                            <div className="text-xs text-muted-foreground">{h.card.set}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-foreground">{h.qty}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-foreground">{fmtUsd(h.card.price)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">{fmtUsd(h.currentValue)}</td>
                      <td className={cn("hidden px-4 py-2.5 text-right font-mono text-xs sm:table-cell", h.pl >= 0 ? "text-success" : "text-destructive")}>
                        {h.pl >= 0 ? "+" : ""}{fmtUsd(h.pl)} ({fmtPct(h.plPct)})
                      </td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        <Sparkline data={h.card.sparkline} positive={h.card.change24h >= 0} width={48} height={18} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
