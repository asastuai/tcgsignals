"use client"

import { useState, useEffect } from "react"
// client component — receives id as prop from server page
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PriceChart } from "@/components/price-chart"
import { Sparkline } from "@/components/sparkline"
import { fetchCardById, fetchCards, getRarityColor, getTcgColor, type CardData } from "@/lib/data"
import { fmtUsd, fmtPct, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Bell,
  Plus,
  Share2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Tag,
  ShoppingCart,
} from "lucide-react"

function getExtendedData(card: CardData) {
  return {
    ...card,
    hp: card.hp || "",
    artist: card.artist || "",
    type: card.types?.[0] || card.supertype || "",
    allTimeHigh: card.price * 1.35,
    allTimeLow: card.price * 0.45,
    avgPrice: card.price * 0.97,
    low30d: card.price * 0.88,
    high30d: card.price * 1.12,
    totalVolume: card.volume * 850,
    totalListings: Math.floor(card.volume * 0.4),
    platforms: [
      { name: "TCGPlayer", price: card.price, condition: "Near Mint", stock: 45, best: true, url: card.tcgplayerUrl },
      { name: "CardMarket", price: card.price * 1.03, condition: "Near Mint", stock: 23, best: false, url: card.cardmarketUrl },
      { name: "eBay", price: card.price * 1.08, condition: "Near Mint", stock: 12, best: false, url: null },
    ],
    sales: Array.from({ length: 8 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: card.price * (0.95 + Math.random() * 0.1),
      platform: ["TCGPlayer", "CardMarket", "eBay"][i % 3],
      condition: i % 4 === 3 ? "LP" : "NM",
    })),
  }
}

export default function CardDetailPage({ id }: { id: string }) {
  const [card, setCard] = useState<ReturnType<typeof getExtendedData> | null>(null)
  const [similar, setSimilar] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const baseCard = await fetchCardById(id)
      if (baseCard) {
        setCard(getExtendedData(baseCard))
        // Fetch similar cards from same TCG
        const tcgId = baseCard.tcg === "One Piece" ? "onepiece" : "pokemon"
        const { cards: sim } = await fetchCards({ tcg: tcgId, sort: "price-desc", pageSize: 6 })
        setSimilar(sim.filter((c) => c.id !== baseCard.id).slice(0, 5))
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">Card not found</p>
            <Link href="/explorer" className="mt-2 inline-block text-sm text-primary hover:underline">Back to Explorer</Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const up = card.change24h >= 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Breadcrumb */}
        <Link href="/explorer" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Explorer
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5 lg:col-span-1">
            {/* Card image with rarity glow */}
            <div className="relative">
              <div
                className="absolute -inset-px rounded-xl opacity-40 blur-md"
                style={{ backgroundColor: getRarityColor(card.rarity) }}
              />
              <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5">
                <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-secondary overflow-hidden">
                  {card.image ? (
                    <img src={card.image} alt={card.name} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-20 w-14 items-center justify-center rounded-lg border border-border/30 bg-secondary/80">
                      <span className="text-xs font-mono">{card.number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* External links */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                <ExternalLink className="h-3 w-3" /> TCGPlayer
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                <ExternalLink className="h-3 w-3" /> CardMarket
              </Button>
            </div>

            {/* Card metadata */}
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/40 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Card Details</h3>
              </div>
              <div className="divide-y divide-border/30 px-4">
                {[
                  { label: "Set", value: card.set },
                  { label: "Number", value: card.number, mono: true },
                  { label: "Rarity", value: card.rarity, color: getRarityColor(card.rarity) },
                  { label: "Type", value: card.type },
                  { label: "HP", value: card.hp, mono: true },
                  { label: "Artist", value: card.artist },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className={cn("text-sm text-foreground", row.mono && "font-mono")}>
                      {row.color ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                          {row.value}
                        </span>
                      ) : row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Set Price Alert</Button>
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add to Portfolio</Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"><Share2 className="h-3.5 w-3.5" /> Share</Button>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Price header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: `${getTcgColor(card.tcg)}25`, color: getTcgColor(card.tcg) }}>
                  {card.tcg}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{card.name}</h1>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-4xl font-bold text-foreground">{fmtUsd(card.price)}</span>
                <span className={`flex items-center gap-1 text-base font-medium ${up ? "text-success" : "text-destructive"}`}>
                  {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {fmtPct(card.change24h)} <span className="text-xs text-muted-foreground">24h</span>
                </span>
                <span className={`text-sm font-medium ${card.change7d >= 0 ? "text-success" : "text-destructive"}`}>{fmtPct(card.change7d)} <span className="text-xs text-muted-foreground">7d</span></span>
                <span className={`text-sm font-medium ${card.change30d >= 0 ? "text-success" : "text-destructive"}`}>{fmtPct(card.change30d)} <span className="text-xs text-muted-foreground">30d</span></span>
              </div>
              <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
                <span>ATH <span className="font-mono text-foreground">{fmtUsd(card.allTimeHigh)}</span></span>
                <span>ATL <span className="font-mono text-foreground">{fmtUsd(card.allTimeLow)}</span></span>
              </div>
            </div>

            {/* Chart */}
            <PriceChart cardId={card.id} positive={up} />

            {/* Market data grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: DollarSign, label: "Market Price", val: fmtUsd(card.price) },
                { icon: BarChart3, label: "Avg Price", val: fmtUsd(card.avgPrice) },
                { icon: TrendingDown, label: "30d Low", val: fmtUsd(card.low30d) },
                { icon: TrendingUp, label: "30d High", val: fmtUsd(card.high30d) },
                { icon: Tag, label: "Volume", val: `$${(card.totalVolume / 1000).toFixed(0)}K` },
                { icon: ShoppingCart, label: "Listings", val: String(card.totalListings) },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3.5 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    <div className="font-mono text-sm font-semibold text-foreground">{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform prices */}
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/40 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Price by Platform</h3>
              </div>
              <div className="divide-y divide-border/30">
                {card.platforms.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                    <span className="min-w-[90px] text-sm font-medium text-foreground">{p.name}</span>
                    <span className="font-mono text-sm text-foreground">{fmtUsd(p.price)}</span>
                    {p.best && <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">Best</span>}
                    <span className="ml-auto text-xs text-muted-foreground">{p.condition}</span>
                    <span className="text-xs text-muted-foreground">{p.stock} in stock</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent sales */}
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/40 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Recent Sales</h3>
              </div>
              <div className="max-h-[260px] overflow-y-auto divide-y divide-border/20">
                {card.sales.map((sale, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                    <span className="w-16 text-xs text-muted-foreground">{sale.date}</span>
                    <span className="font-mono font-medium text-foreground">{fmtUsd(sale.price)}</span>
                    <span className="text-xs text-muted-foreground">{sale.platform}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{sale.condition}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar cards */}
            {similar.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Similar Cards</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {similar.map((c) => {
                    const cUp = c.change24h >= 0
                    return (
                      <Link
                        key={c.id}
                        href={`/card/${c.id}`}
                        className="w-36 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-primary/30"
                      >
                        <div className="aspect-[5/4] bg-secondary/60 overflow-hidden flex items-center justify-center">
                          {c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-contain" loading="lazy" /> : null}
                        </div>
                        <div className="p-2.5">
                          <div className="truncate text-xs font-medium text-foreground">{c.name}</div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-foreground">{fmtUsd(c.price)}</span>
                            <span className={`text-[10px] font-medium ${cUp ? "text-success" : "text-destructive"}`}>{fmtPct(c.change24h)}</span>
                          </div>
                          <Sparkline data={c.sparkline} positive={cUp} width={100} height={16} className="mt-1.5 w-full" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
