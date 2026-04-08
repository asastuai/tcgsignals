"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sparkline } from "@/components/sparkline"
import { cards, tcgCategories, getRarityColor, getTcgColor, type CardData, type TCG } from "@/lib/data"
import { fmtUsd, fmtPct, fmt, cn } from "@/lib/utils"
import { Search, SlidersHorizontal, Grid3X3, List, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type SortKey = "price-desc" | "price-asc" | "change-desc" | "change-asc" | "name"
type ViewMode = "grid" | "list"

const rarities = ["Common", "Uncommon", "Rare", "Ultra Rare", "Secret Rare", "Special Art"] as const
const sortOptions: { value: SortKey; label: string }[] = [
  { value: "price-desc", label: "Price: High to Low" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "change-desc", label: "24h Change" },
  { value: "name", label: "Name A-Z" },
]

export default function ExplorerPage() {
  const [search, setSearch] = useState("")
  const [tcgFilter, setTcgFilter] = useState<string>("all")
  const [rarityFilter, setRarityFilter] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>("price-desc")
  const [view, setView] = useState<ViewMode>("grid")
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const pageSize = 12

  const filtered = useMemo(() => {
    let result = [...cards]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.set.toLowerCase().includes(q))
    }
    if (tcgFilter !== "all") result = result.filter((c) => c.tcg === tcgFilter)
    if (rarityFilter.length) result = result.filter((c) => rarityFilter.includes(c.rarity))

    switch (sort) {
      case "price-desc": result.sort((a, b) => b.price - a.price); break
      case "price-asc": result.sort((a, b) => a.price - b.price); break
      case "change-desc": result.sort((a, b) => b.change24h - a.change24h); break
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break
    }
    return result
  }, [search, tcgFilter, rarityFilter, sort])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const hasActiveFilters = tcgFilter !== "all" || rarityFilter.length > 0 || search.length > 0

  const clearFilters = () => {
    setSearch("")
    setTcgFilter("all")
    setRarityFilter([])
    setPage(1)
  }

  const toggleRarity = (r: string) => {
    setRarityFilter((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Card Explorer</h1>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {fmt(filtered.length)} cards
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Browse and discover cards across all supported TCGs</p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cards or sets..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-full rounded-lg border border-border/60 bg-secondary/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* TCG pills - desktop */}
            <div className="hidden items-center gap-1 md:flex">
              <button
                onClick={() => { setTcgFilter("all"); setPage(1) }}
                className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  tcgFilter === "all" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              {tcgCategories.map((t) => (
                <button
                  key={t.name}
                  onClick={() => { setTcgFilter(t.name); setPage(1) }}
                  className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    tcgFilter === t.name ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </button>
              ))}
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-border/60 bg-secondary/40 px-2.5 text-xs text-foreground focus:outline-none"
            >
              {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">!</span>}
            </Button>

            <div className="flex overflow-hidden rounded-lg border border-border/60">
              <button onClick={() => setView("grid")} className={cn("p-1.5", view === "grid" ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-muted-foreground")}>
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView("list")} className={cn("p-1.5", view === "list" ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-muted-foreground")}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Rarity</span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:text-primary/80">Clear all</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {rarities.map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRarity(r)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    rarityFilter.includes(r)
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getRarityColor(r) }} />
                  {r}
                </button>
              ))}
            </div>
            {/* Mobile TCG selector */}
            <div className="mt-4 flex flex-wrap gap-2 md:hidden">
              <span className="w-full text-sm font-medium text-foreground mb-1">TCG</span>
              {tcgCategories.map((t) => (
                <button
                  key={t.name}
                  onClick={() => { setTcgFilter(tcgFilter === t.name ? "all" : t.name); setPage(1) }}
                  className={cn("flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    tcgFilter === t.name ? "border-primary/40 bg-primary/10 text-foreground" : "border-border/60 text-muted-foreground"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {search && (
              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-foreground">
                {`"${search}"`}
                <button onClick={() => setSearch("")}><X className="h-3 w-3 text-muted-foreground" /></button>
              </span>
            )}
            {tcgFilter !== "all" && (
              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-foreground">
                {tcgFilter}
                <button onClick={() => setTcgFilter("all")}><X className="h-3 w-3 text-muted-foreground" /></button>
              </span>
            )}
            {rarityFilter.map((r) => (
              <span key={r} className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-foreground">
                {r}
                <button onClick={() => toggleRarity(r)}><X className="h-3 w-3 text-muted-foreground" /></button>
              </span>
            ))}
          </div>
        )}

        {/* Results */}
        {paged.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-foreground">No cards found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
            <button onClick={clearFilters} className="mt-3 text-sm font-medium text-primary">Clear all filters</button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {paged.map((card) => (
              <GridCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/30 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Card</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Set</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Rarity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">24h</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">7d</th>
                  <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">Chart</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((card, i) => (
                  <ListRow key={card.id} card={card} idx={(page - 1) * pageSize + i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {fmt(filtered.length)}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn("h-8 w-8 rounded-md text-xs font-medium transition-colors",
                      page === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

/* ─── Sub-components ─── */

function GridCard({ card }: { card: CardData }) {
  const up = card.change24h >= 0
  return (
    <Link
      href={`/card/${card.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/30"
    >
      <div className="relative aspect-[5/6] bg-secondary/60 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: getTcgColor(card.tcg) }} />
        <div className="flex h-full items-center justify-center">
          <div className="flex h-14 w-10 items-center justify-center rounded border border-border/40 bg-secondary text-[10px] font-mono text-muted-foreground/50">
            {card.number}
          </div>
        </div>
        <span className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: `${getTcgColor(card.tcg)}25`, color: getTcgColor(card.tcg) }}>
          {card.tcg}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="truncate text-sm font-medium text-foreground">{card.name}</h3>
        <p className="truncate text-xs text-muted-foreground">{card.set}</p>
        <div className="mt-auto flex items-end justify-between pt-1">
          <div>
            <span className="font-mono text-base font-semibold text-foreground">{fmtUsd(card.price)}</span>
            <span className={`block text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>{fmtPct(card.change24h)}</span>
          </div>
          <Sparkline data={card.sparkline} positive={up} width={48} height={20} />
        </div>
      </div>
    </Link>
  )
}

function ListRow({ card, idx }: { card: CardData; idx: number }) {
  const up24 = card.change24h >= 0
  const up7 = card.change7d >= 0
  return (
    <tr className="border-b border-border/20 transition-colors hover:bg-secondary/30">
      <td className="px-4 py-3 text-xs text-muted-foreground">{idx}</td>
      <td className="px-4 py-3">
        <Link href={`/card/${card.id}`} className="font-medium text-foreground hover:text-primary">{card.name}</Link>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{card.set}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getRarityColor(card.rarity) }} />
          {card.rarity}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm text-foreground">{fmtUsd(card.price)}</td>
      <td className={`px-4 py-3 text-right text-xs font-medium ${up24 ? "text-success" : "text-destructive"}`}>{fmtPct(card.change24h)}</td>
      <td className={`px-4 py-3 text-right text-xs font-medium ${up7 ? "text-success" : "text-destructive"}`}>{fmtPct(card.change7d)}</td>
      <td className="hidden px-4 py-3 sm:table-cell"><Sparkline data={card.sparkline} positive={up24} width={56} height={20} /></td>
    </tr>
  )
}
