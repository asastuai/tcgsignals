"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getTrending, getTcgColor, type CardData } from "@/lib/data"
import { fmtUsd, fmtPct } from "@/lib/utils"
import { Sparkline } from "@/components/sparkline"
import { Heart } from "lucide-react"

function TrendingCard({ card }: { card: CardData }) {
  const [hearted, setHearted] = useState(false)
  const up = card.change24h >= 0

  return (
    <Link
      href={`/card/${card.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.04]"
    >
      {/* Image area with rarity top stripe */}
      <div className="relative aspect-[5/6] bg-secondary/80 overflow-hidden">
        {/* Rarity color strip at top */}
        <div className="absolute inset-x-0 top-0 z-10 h-0.5" style={{ backgroundColor: getTcgColor(card.tcg) }} />

        {/* Placeholder card illustration */}
        <div className="flex h-full w-full items-center justify-center transition-transform group-hover:scale-[1.03]">
          <div className="flex h-16 w-12 items-center justify-center rounded-lg border border-border/40 bg-secondary text-muted-foreground/40">
            <span className="text-xs font-mono">{card.number}</span>
          </div>
        </div>

        {/* TCG badge */}
        <span
          className="absolute left-2 top-2.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/90"
          style={{ backgroundColor: `${getTcgColor(card.tcg)}30` }}
        >
          {card.tcg}
        </span>

        {/* Heart */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setHearted(!hearted)
          }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Heart
            className={`h-3.5 w-3.5 ${hearted ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="truncate text-sm font-medium text-foreground">{card.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{card.set}</p>
        </div>
        <div className="mt-auto flex items-end justify-between">
          <div>
            <div className="font-mono text-base font-semibold text-foreground">{fmtUsd(card.price)}</div>
            <span className={`text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>
              {fmtPct(card.change24h)}
            </span>
          </div>
          <Sparkline data={card.sparkline} positive={up} width={48} height={20} />
        </div>
      </div>
    </Link>
  )
}

export function TrendingCards() {
  const [trending, setTrending] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrending().then((data) => {
      setTrending(data)
      setLoading(false)
    })
  }, [])

  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Trending Cards</h2>
            <p className="mt-1 text-sm text-muted-foreground">Most traded cards right now</p>
          </div>
          <Link href="/explorer" className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
                <div className="aspect-[5/6] animate-pulse bg-secondary/80" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                  <div className="h-5 w-1/3 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {trending.map((card) => (
              <TrendingCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
