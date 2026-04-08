"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getGainers, getLosers, type CardData } from "@/lib/data"
import { fmtUsd, fmtPct } from "@/lib/utils"
import { Sparkline } from "@/components/sparkline"
import { TrendingUp, TrendingDown } from "lucide-react"

function MoverRow({ card, rank }: { card: CardData; rank: number }) {
  const up = card.change24h >= 0
  return (
    <Link
      href={`/card/${card.id}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary/50"
    >
      <span className="w-5 text-center text-xs font-medium text-muted-foreground">{rank}</span>
      <div className="h-9 w-7 shrink-0 overflow-hidden rounded bg-secondary">
        {card.imageSmall && <img src={card.imageSmall} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{card.name}</div>
        <div className="truncate text-xs text-muted-foreground">{card.set}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm text-foreground">{fmtUsd(card.price)}</div>
        <div className={`text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>
          {fmtPct(card.change24h)}
        </div>
      </div>
      <Sparkline data={card.sparkline} positive={up} width={56} height={22} className="hidden sm:block" />
    </Link>
  )
}

function MoverColumn({
  title,
  icon: Icon,
  cards,
  accent,
}: {
  title: string
  icon: typeof TrendingUp
  cards: CardData[]
  accent: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
        <div className={`flex h-6 w-6 items-center justify-center rounded-md ${accent}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border/30 px-2 py-1">
        {cards.length > 0 ? cards.map((card, i) => (
          <MoverRow key={card.id} card={card} rank={i + 1} />
        )) : (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        )}
      </div>
    </div>
  )
}

export function TopMovers() {
  const [gainers, setGainers] = useState<CardData[]>([])
  const [losers, setLosers] = useState<CardData[]>([])

  useEffect(() => {
    getGainers().then(setGainers)
    getLosers().then(setLosers)
  }, [])

  return (
    <section className="border-y border-border/40 bg-secondary/20 py-14">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Top Movers</h2>
          <p className="mt-1 text-sm text-muted-foreground">Biggest price changes in the last 24 hours</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <MoverColumn
            title="Biggest Gainers"
            icon={TrendingUp}
            cards={gainers}
            accent="bg-success/15 text-success"
          />
          <MoverColumn
            title="Biggest Losers"
            icon={TrendingDown}
            cards={losers}
            accent="bg-destructive/15 text-destructive"
          />
        </div>
      </div>
    </section>
  )
}
