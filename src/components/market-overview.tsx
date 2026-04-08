"use client"

import { useState, useEffect } from "react"
import { fetchTcgCounts } from "@/lib/data"
import { fmt } from "@/lib/utils"

export function MarketOverview() {
  const [selected, setSelected] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ name: string; color: string; count: number; id: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTcgCounts().then((data) => {
      setCategories(data)
      setLoading(false)
    })
  }, [])

  const totalCards = categories.reduce((s, c) => s + c.count, 0)

  if (loading) {
    return (
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mb-6">
            <div className="h-7 w-48 animate-pulse rounded bg-secondary" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-secondary" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-32 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Market Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmt(totalCards)} cards tracked across {categories.length} trading card games
          </p>
        </div>

        {/* TCG pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((tcg) => {
            const active = selected === tcg.name
            return (
              <button
                key={tcg.name}
                onClick={() => setSelected(active ? null : tcg.name)}
                className={`group flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full transition-transform group-hover:scale-125"
                  style={{ backgroundColor: tcg.color }}
                />
                {tcg.name}
                <span className="text-xs text-muted-foreground">{fmt(tcg.count)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
