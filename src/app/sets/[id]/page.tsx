"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sparkline } from "@/components/sparkline"
import { getSetById, getCardsBySet, getRarityColor, getTcgColor, cards as allCards, type CardData } from "@/lib/data"
import { fmtUsd, fmtPct, cn, generateSparkline } from "@/lib/utils"
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
  Heart,
  ChevronDown,
} from "lucide-react"

export default function SetDetailPage() {
  const params = useParams()
  const setId = params.id as string

  const set = getSetById(setId)
  const setCards = getCardsBySet(setId)

  // If no cards found for this set, generate some mock ones
  const displayCards: CardData[] = useMemo(() => {
    if (setCards.length > 0) return setCards
    if (!set) return []
    const rarities: CardData["rarity"][] = ["Common", "Uncommon", "Rare", "Ultra Rare", "Secret Rare", "Special Art"]
    const names = ["Blaziken", "Gardevoir", "Salamence", "Metagross", "Milotic", "Absol", "Flygon", "Altaria", "Aggron", "Manectric", "Medicham", "Banette", "Dusclops", "Sableye", "Mawile", "Tropius", "Chimecho", "Walrein", "Glalie", "Relicanth", "Luvdisc", "Bagon", "Beldum", "Camerupt", "Torkoal"]
    return Array.from({ length: Math.min(set.cardCount, 24) }, (_, i) => {
      const rarity = rarities[Math.floor((i / 24) * rarities.length)]
      const basePrice = rarity === "Common" ? 0.5 : rarity === "Uncommon" ? 2 : rarity === "Rare" ? 10 : rarity === "Ultra Rare" ? 50 : rarity === "Secret Rare" ? 120 : 200
      const price = basePrice + Math.sin(i * 7.3) * basePrice * 0.5
      const change = Math.sin(i * 3.7) * 15
      return {
        id: `${setId}-card-${i}`,
        name: `${names[i % names.length]}${i >= names.length ? ` ${rarities[i % rarities.length]}` : ""}`,
        set: set.name,
        setId,
        tcg: set.tcg,
        rarity,
        number: String(i + 1).padStart(3, "0") + "/" + String(Math.min(set.cardCount, 24)).padStart(3, "0"),
        image: "/placeholder.svg?height=280&width=200",
        imageSmall: "/placeholder.svg?height=140&width=100",
        price: Math.round(Math.abs(price) * 100) / 100,
        change24h: Math.round(change * 100) / 100,
        change7d: Math.round(change * 1.5 * 100) / 100,
        change30d: Math.round(change * 2.2 * 100) / 100,
        volume: Math.floor(Math.abs(Math.sin(i * 5.1)) * 500),
        sparkline: generateSparkline(Math.abs(price), 20, change > 0 ? "up" : "down"),
      } as CardData
    })
  }, [set, setCards, setId])

  const [search, setSearch] = useState("")
  const [rarityFilter, setRarityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("number")

  const filtered = useMemo(() => {
    let result = [...displayCards]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.name.toLowerCase().includes(q))
    }
    if (rarityFilter !== "all") result = result.filter((c) => c.rarity === rarityFilter)
    switch (sortBy) {
      case "price-desc": result.sort((a, b) => b.price - a.price); break
      case "price-asc": result.sort((a, b) => a.price - b.price); break
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break
      default: result.sort((a, b) => parseInt(a.number) - parseInt(b.number))
    }
    return result
  }, [displayCards, search, rarityFilter, sortBy])

  if (!set) {
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

  const mostValuable = [...displayCards].sort((a, b) => b.price - a.price)[0]
  const cheapest = [...displayCards].sort((a, b) => a.price - b.price)[0]
  const up = set.trending >= 0
  const uniqueRarities = [...new Set(displayCards.map((c) => c.rarity))]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Back */}
        <Link href="/sets" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Sets
        </Link>

        {/* Set Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card" style={{ borderTopColor: getTcgColor(set.tcg), borderTopWidth: 2 }}>
              <Layers className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div>
              <span className="mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: `${getTcgColor(set.tcg)}20`, color: getTcgColor(set.tcg) }}>{set.tcg}</span>
              <h1 className="text-2xl font-bold text-foreground">{set.name}</h1>
              <p className="text-sm text-muted-foreground">{set.series}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(set.releaseDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{set.cardCount} cards</span>
                <span className={cn("flex items-center gap-1 font-medium", up ? "text-success" : "text-destructive")}>
                  {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {fmtPct(set.trending)}
                </span>
              </div>
            </div>
          </div>

          {/* Value card */}
          <div className="rounded-xl border border-border/60 bg-card p-4 text-center lg:min-w-[200px]">
            <div className="text-xs text-muted-foreground">Complete Set Value</div>
            <div className="mt-1 font-mono text-2xl font-bold text-foreground">{fmtUsd(set.totalValue)}</div>
            <div className="mt-1 text-xs text-muted-foreground">Avg card: <span className="font-mono text-foreground">{fmtUsd(set.avgValue)}</span></div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search cards..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-border/60 bg-secondary/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none" />
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
                  <option value="name">Name</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Cards Grid */}
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">No cards found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filtered.map((card) => {
                  const cardUp = card.change24h >= 0
                  return (
                    <Link key={card.id} href={`/card/${card.id}`} className="group overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/30">
                      {/* Rarity top bar */}
                      <div className="h-0.5" style={{ backgroundColor: getRarityColor(card.rarity) }} />
                      {/* Image area */}
                      <div className="relative flex aspect-[3/4] items-center justify-center bg-secondary/30">
                        <span className="font-mono text-lg text-muted-foreground/20">#{card.number.split("/")[0]}</span>
                        <div className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-foreground backdrop-blur-sm">#{card.number}</div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation() }} className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background">
                          <Heart className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                      {/* Info */}
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
                        <div className="mt-1.5">
                          <Sparkline data={card.sparkline} positive={cardUp} height={24} />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Stats */}
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
                    <div className="font-mono text-sm font-bold text-foreground">{fmtUsd(set.avgValue)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rarity Breakdown */}
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Rarity Breakdown</h2>
              <div className="flex flex-col gap-1.5">
                {uniqueRarities.map((rarity) => {
                  const count = displayCards.filter((c) => c.rarity === rarity).length
                  const pct = displayCards.length > 0 ? (count / displayCards.length) * 100 : 0
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
