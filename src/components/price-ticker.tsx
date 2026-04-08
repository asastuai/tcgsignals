"use client"

import { useEffect, useState } from "react"
import { getTrending, type CardData } from "@/lib/data"
import { fmtUsd, fmtPct } from "@/lib/utils"

/**
 * Horizontal scrolling price ticker. Uses pure CSS animation (animate-ticker
 * from globals.css) so it pauses on hover and costs zero JS at runtime.
 */
export function PriceTicker() {
  const [items, setItems] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrending(10).then((data) => {
      // Sort by volume descending, pick top 10
      const sorted = [...data].sort((a, b) => b.volume - a.volume).slice(0, 10)
      setItems(sorted)
      setLoading(false)
    })
  }, [])

  if (loading || items.length === 0) {
    return (
      <div className="w-full overflow-hidden border-y border-border/40 bg-card/30">
        <div className="flex items-center gap-6 py-2.5 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="h-5 w-10 animate-pulse rounded bg-secondary" />
              <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
              <div className="h-4 w-14 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden border-y border-border/40 bg-card/30">
      <div className="animate-ticker flex w-max items-center gap-6 py-2.5">
        {/* Duplicate for seamless loop */}
        {[...items, ...items].map((card, i) => (
          <div key={`${card.id}-${i}`} className="flex items-center gap-2.5 px-1">
            <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {card.tcg}
            </span>
            <span className="text-sm font-medium text-foreground">{card.name}</span>
            <span className="font-mono text-sm text-foreground">{fmtUsd(card.price)}</span>
            <span className={`text-xs font-medium ${card.change24h >= 0 ? "text-success" : "text-destructive"}`}>
              {fmtPct(card.change24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
