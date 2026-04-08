"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sparkline } from "@/components/sparkline"
import { fetchCardById, fetchCards, getTcgColor, type CardData } from "@/lib/data"
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
import { Plus, Search, TrendingUp, Layers, FolderOpen, Trophy, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

/* ─── Types ─── */
interface PortfolioEntry {
  cardId: string
  qty: number
  avgCost: number
  addedAt: string
}

interface HoldingWithCard {
  entry: PortfolioEntry
  card: CardData
  currentValue: number
  totalCost: number
  pl: number
  plPct: number
}

const STORAGE_KEY = "tcg-portfolio"

function loadPortfolio(): PortfolioEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function savePortfolio(entries: PortfolioEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

/* ─── Add Card Modal ─── */
function AddCardModal({ onClose, onAdd }: { onClose: () => void; onAdd: (entry: PortfolioEntry) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CardData[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<CardData | null>(null)
  const [qty, setQty] = useState("1")
  const [cost, setCost] = useState("")

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timeout = setTimeout(() => {
      setSearching(true)
      fetchCards({ search: query, pageSize: 8 }).then(({ cards }) => {
        setResults(cards)
        setSearching(false)
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  function handleAdd() {
    if (!selected) return
    const parsedQty = parseInt(qty) || 1
    const parsedCost = parseFloat(cost) || selected.price
    onAdd({
      cardId: selected.id,
      qty: parsedQty,
      avgCost: parsedCost,
      addedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-xl border border-border/60 bg-background p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Add Card to Portfolio</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {!selected ? (
          <>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Search for a card..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-border/60 bg-secondary/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {searching && <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>}
              {!searching && results.length === 0 && query.length >= 2 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No cards found</p>
              )}
              {results.map((card) => (
                <button
                  key={card.id}
                  onClick={() => { setSelected(card); setCost(card.price.toFixed(2)) }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary/40"
                >
                  {card.image ? (
                    <img src={card.image} alt="" className="h-10 w-7 rounded object-contain" />
                  ) : (
                    <div className="h-10 w-7 rounded bg-secondary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{card.name}</div>
                    <div className="text-xs text-muted-foreground">{card.set} · {card.rarity}</div>
                  </div>
                  <span className="shrink-0 font-mono text-sm text-foreground">{fmtUsd(card.price)}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
              {selected.image ? (
                <img src={selected.image} alt="" className="h-14 w-10 rounded object-contain" />
              ) : (
                <div className="h-14 w-10 rounded bg-secondary" />
              )}
              <div>
                <div className="text-sm font-medium text-foreground">{selected.name}</div>
                <div className="text-xs text-muted-foreground">{selected.set}</div>
                <div className="mt-0.5 font-mono text-sm text-foreground">{fmtUsd(selected.price)}</div>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Change</button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/60 bg-secondary/40 px-3 text-sm font-mono text-foreground focus:border-primary/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Purchase Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/60 bg-secondary/40 px-3 text-sm font-mono text-foreground focus:border-primary/40 focus:outline-none"
                />
              </div>
            </div>

            <Button onClick={handleAdd} className="w-full gap-1.5">
              <Plus className="h-4 w-4" /> Add to Portfolio
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function PortfolioPage() {
  const [entries, setEntries] = useState<PortfolioEntry[]>([])
  const [holdings, setHoldings] = useState<HoldingWithCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  // Load portfolio and fetch card data
  const loadHoldings = useCallback(async (portfolioEntries: PortfolioEntry[]) => {
    if (portfolioEntries.length === 0) {
      setHoldings([])
      setLoading(false)
      return
    }

    const results: HoldingWithCard[] = []
    for (const entry of portfolioEntries) {
      const card = await fetchCardById(entry.cardId)
      if (card) {
        const currentValue = entry.qty * card.price
        const totalCost = entry.qty * entry.avgCost
        results.push({
          entry,
          card,
          currentValue,
          totalCost,
          pl: currentValue - totalCost,
          plPct: entry.avgCost > 0 ? ((card.price - entry.avgCost) / entry.avgCost) * 100 : 0,
        })
      }
    }
    setHoldings(results)
    setLoading(false)
  }, [])

  useEffect(() => {
    const stored = loadPortfolio()
    setEntries(stored)
    loadHoldings(stored)
  }, [loadHoldings])

  function handleAdd(entry: PortfolioEntry) {
    // If card already in portfolio, update qty
    const existing = entries.findIndex((e) => e.cardId === entry.cardId)
    let updated: PortfolioEntry[]
    if (existing >= 0) {
      const old = entries[existing]
      const totalQty = old.qty + entry.qty
      const weightedCost = (old.qty * old.avgCost + entry.qty * entry.avgCost) / totalQty
      updated = entries.map((e, i) => i === existing ? { ...e, qty: totalQty, avgCost: weightedCost } : e)
    } else {
      updated = [...entries, entry]
    }
    setEntries(updated)
    savePortfolio(updated)
    setShowAdd(false)
    setLoading(true)
    loadHoldings(updated)
  }

  function handleRemove(cardId: string) {
    const updated = entries.filter((e) => e.cardId !== cardId)
    setEntries(updated)
    savePortfolio(updated)
    setHoldings((prev) => prev.filter((h) => h.entry.cardId !== cardId))
  }

  // Derived stats
  const portfolioValue = holdings.reduce((s, h) => s + h.currentValue, 0)
  const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0)
  const totalPl = portfolioValue - totalCost
  const totalPlPct = totalCost > 0 ? (totalPl / totalCost) * 100 : 0
  const totalCards = holdings.reduce((s, h) => s + h.entry.qty, 0)
  const uniqueSets = new Set(holdings.map((h) => h.card.set)).size
  const best = [...holdings].sort((a, b) => b.plPct - a.plPct)[0]

  const filtered = useMemo(() => {
    if (!search) return holdings
    const q = search.toLowerCase()
    return holdings.filter((h) => h.card.name.toLowerCase().includes(q) || h.card.set.toLowerCase().includes(q))
  }, [search, holdings])

  // Allocation by TCG
  const tcgAlloc = useMemo(() => {
    if (portfolioValue === 0) return []
    return Object.entries(
      holdings.reduce<Record<string, number>>((acc, h) => {
        acc[h.card.tcg] = (acc[h.card.tcg] ?? 0) + h.currentValue
        return acc
      }, {})
    )
      .map(([name, value]) => ({ name, value: Math.round((value / portfolioValue) * 100), color: getTcgColor(name) }))
      .sort((a, b) => b.value - a.value)
  }, [holdings, portfolioValue])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Portfolio</h1>
            {holdings.length > 0 && (
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-4xl font-bold text-foreground">{fmtUsd(portfolioValue)}</span>
                <span className={cn("text-sm font-medium", totalPl >= 0 ? "text-success" : "text-destructive")}>
                  {totalPl >= 0 ? "+" : ""}{fmtUsd(totalPl)} ({fmtPct(totalPlPct)}) all-time
                </span>
              </div>
            )}
          </div>
          <Button onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Card
          </Button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Loading portfolio...</p>
          </div>
        ) : holdings.length === 0 ? (
          <div className="py-16 text-center">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-lg font-medium text-foreground">Your portfolio is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first card to start tracking your collection value.</p>
            <Button onClick={() => setShowAdd(true)} className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" /> Add Your First Card
            </Button>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { icon: Layers, label: "Total Cards", value: String(totalCards) },
                { icon: FolderOpen, label: "Unique Sets", value: String(uniqueSets) },
                { icon: Trophy, label: "Best Performer", value: best ? `${best.card.name.length > 14 ? best.card.name.slice(0, 14) + "..." : best.card.name} ${fmtPct(best.plPct)}` : "-" },
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
              {tcgAlloc.length > 0 && (
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
              )}

              {/* Holdings table */}
              <div className={cn("rounded-xl border border-border/60 bg-card", tcgAlloc.length > 0 ? "lg:col-span-2" : "lg:col-span-3")}>
                <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">Holdings ({holdings.length})</h3>
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
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((h) => (
                        <tr key={h.card.id} className="border-b border-border/20 transition-colors hover:bg-secondary/30">
                          <td className="px-4 py-2.5">
                            <Link href={`/card/${h.card.id}`} className="flex items-center gap-2">
                              {h.card.image ? (
                                <img src={h.card.image} alt="" className="h-8 w-6 shrink-0 rounded object-contain" />
                              ) : (
                                <div className="h-8 w-6 shrink-0 rounded bg-secondary" />
                              )}
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-foreground">{h.card.name}</div>
                                <div className="text-xs text-muted-foreground">{h.card.set}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-foreground">{h.entry.qty}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-foreground">{fmtUsd(h.card.price)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">{fmtUsd(h.currentValue)}</td>
                          <td className={cn("hidden px-4 py-2.5 text-right font-mono text-xs sm:table-cell", h.pl >= 0 ? "text-success" : "text-destructive")}>
                            {h.pl >= 0 ? "+" : ""}{fmtUsd(h.pl)} ({fmtPct(h.plPct)})
                          </td>
                          <td className="hidden px-4 py-2.5 sm:table-cell">
                            {h.card.sparkline && h.card.sparkline.length > 0 && (
                              <Sparkline data={h.card.sparkline} positive={h.card.change24h >= 0} width={48} height={18} />
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => handleRemove(h.entry.cardId)}
                              className="text-muted-foreground/50 transition-colors hover:text-destructive"
                              title="Remove from portfolio"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />

      {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
