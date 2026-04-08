"use client"

import { useState, useMemo, useEffect } from "react"
// client component — receives id as prop from server page
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sparkline } from "@/components/sparkline"
import { fetchSetById, fetchCards, getRarityColor, getTcgColor, type CardData, type SetData } from "@/lib/data"
import { fmtUsd, fmtPct, cn } from "@/lib/utils"
import {
  ArrowLeft,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  Crown,
  Tag,
  DollarSign,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const PAGE_SIZE = 48

export default function SetDetailPage({ id }: { id: string }) {
  const setId = id

  const [set, setSet] = useState<(SetData & { totalValue?: number; avgValue?: number }) | null>(null)
  const [cards, setCards] = useState<CardData[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [rarityFilter, setRarityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("number")
  const [page, setPage] = useState(1)

  // Fetch set info
  useEffect(() => {
    fetchSetById(setId).then((data) => {
      if (data) {
        setSet(data as SetData)
      } else {
        setSet(null)
      }
    })
  }, [setId])

  // Fetch cards for this set
  useEffect(() => {
    setLoading(true)
    fetchCards({
      set: setId,
      sort: sortBy,
      search: search || undefined,
      rarity: rarityFilter !== "all" ? rarityFilter : undefined,
      page,
      pageSize: PAGE_SIZE,
    }).then(({ cards: fetchedCards, total }) => {
      setCards(fetchedCards)
      setTotalCards(total)
      setLoading(false)
    })
  }, [setId, sortBy, search, rarityFilter, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, rarityFilter, sortBy])

  // Derived stats
  const totalValue = useMemo(() => cards.reduce((sum, c) => sum + c.price, 0), [cards])
  const avgValue = useMemo(() => (cards.length > 0 ? totalValue / cards.length : 0), [totalValue, cards])
  const mostValuable = useMemo(() => [...cards].sort((a, b) => b.price - a.price)[0], [cards])
  const cheapest = useMemo(() => [...cards].sort((a, b) => a.price - b.price)[0], [cards])
  const uniqueRarities = useMemo(() => [...new Set(cards.map((c) => c.rarity))], [cards])
  const totalPages = Math.ceil(totalCards / PAGE_SIZE)

  if (set === null && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">Set not found</p>
            <Link href="/sets" className="mt-2 inline-block text-sm text-primary hover:underline">Back to Sets</Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Back */}
        <Link href="/sets" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Sets
        </Link>

        {set ? (
          <>
            {/* Set Header */}
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-card" style={{ borderTopColor: getTcgColor(set.tcg), borderTopWidth: 2 }}>
                  {set.imageUrl ? (
                    <Image src={set.imageUrl} alt={set.name} width={80} height={80} className="object-contain p-1" />
                  ) : (
                    <Layers className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div>
                  <span className="mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: `${getTcgColor(set.tcg)}20`, color: getTcgColor(set.tcg) }}>{set.tcg}</span>
                  <h1 className="text-2xl font-bold text-foreground">{set.name}</h1>
                  <p className="text-sm text-muted-foreground">{set.series}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(set.releaseDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{set.cardCount} cards</span>
                  </div>
                </div>
              </div>

              {/* Value card */}
              <div className="rounded-xl border border-border/60 bg-card p-4 text-center lg:min-w-[200px]">
                <div className="text-xs text-muted-foreground">Page Set Value</div>
                <div className="mt-1 font-mono text-2xl font-bold text-foreground">{fmtUsd(totalValue)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Avg card: <span className="font-mono text-foreground">{fmtUsd(avgValue)}</span></div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-4">
              {/* Main content */}
              <div className="lg:col-span-3">
                {/* Toolbar */}
                <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" placeholder="Search cards in this set..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-border/60 bg-secondary/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none" />
                  </div>
                  <div className="relative">
                    <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className="h-9 appearance-none rounded-lg border border-border/60 bg-secondary/40 pl-3 pr-8 text-sm text-foreground focus:border-primary/40 focus:outline-none">
                      <option value="all">All Rarities</option>
                      {uniqueRarities.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <div className="relative">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 appearance-none rounded-lg border border-border/60 bg-secondary/40 pl-3 pr-8 text-sm text-foreground focus:border-primary/40 focus:outline-none">
                      <option value="number">Card Number</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="name-asc">Name: A-Z</option>
                      <option value="name-desc">Name: Z-A</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {/* Cards Grid */}
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading cards...</p>
                  </div>
                ) : cards.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-muted-foreground">No cards found matching your criteria</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {cards.map((card) => {
                        const cardUp = card.change24h >= 0
                        return (
                          <Link key={card.id} href={`/card/${card.id}`} className="group overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/30">
                            <div className="h-0.5" style={{ backgroundColor: getRarityColor(card.rarity) }} />
                            <div className="relative flex aspect-[3/4] items-center justify-center bg-secondary/30">
                              {card.image ? (
                                <Image src={card.image} alt={card.name} fill className="object-contain p-1" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" />
                              ) : (
                                <span className="font-mono text-lg text-muted-foreground/20">#{card.number?.split("/")[0]}</span>
                              )}
                              <div className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-foreground backdrop-blur-sm">#{card.number}</div>
                            </div>
                            <div className="p-2.5">
                              <h3 className="truncate text-sm font-medium text-foreground">{card.name}</h3>
                              <div className="mt-0.5 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getRarityColor(card.rarity) }} />
                                <span className="text-[10px] text-muted-foreground">{card.rarity}</span>
                              </div>
                              <div className="mt-2 flex items-end justify-between">
                                <span className="font-mono text-sm font-bold text-foreground">{fmtUsd(card.price)}</span>
                                <span className={cn("text-[11px] font-medium", cardUp ? "text-success" : "text-destructive")}>{fmtPct(card.change24h)}</span>
                              </div>
                              {card.sparkline && card.sparkline.length > 0 && (
                                <div className="mt-1.5">
                                  <Sparkline data={card.sparkline} positive={cardUp} height={24} />
                                </div>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-muted-foreground">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <h2 className="mb-3 text-sm font-semibold text-foreground">Set Statistics</h2>
                  <div className="flex flex-col gap-3">
                    {mostValuable && (
                      <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FBBF24]/15"><Crown className="h-4 w-4 text-[#FBBF24]" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-muted-foreground">Most Valuable</div>
                          <div className="truncate text-sm font-medium text-foreground">{mostValuable.name}</div>
                          <div className="font-mono text-xs text-foreground">{fmtUsd(mostValuable.price)}</div>
                        </div>
                      </div>
                    )}
                    {cheapest && (
                      <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15"><Tag className="h-4 w-4 text-success" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-muted-foreground">Cheapest Card</div>
                          <div className="truncate text-sm font-medium text-foreground">{cheapest.name}</div>
                          <div className="font-mono text-xs text-foreground">{fmtUsd(cheapest.price)}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15"><DollarSign className="h-4 w-4 text-primary" /></div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Average Price</div>
                        <div className="font-mono text-sm font-bold text-foreground">{fmtUsd(avgValue)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {uniqueRarities.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-card p-4">
                    <h2 className="mb-3 text-sm font-semibold text-foreground">Rarity Breakdown</h2>
                    <div className="flex flex-col gap-1.5">
                      {uniqueRarities.map((rarity) => {
                        const count = cards.filter((c) => c.rarity === rarity).length
                        const pct = cards.length > 0 ? (count / cards.length) * 100 : 0
                        return (
                          <div key={rarity}>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getRarityColor(rarity) }} />
                                <span className="text-foreground">{rarity}</span>
                              </div>
                              <span className="text-muted-foreground">{count}</span>
                            </div>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary/60">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: getRarityColor(rarity) }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Loading set...</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
