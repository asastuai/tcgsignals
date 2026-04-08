"use client"

import { useEffect, useState } from "react"
import { fetchRecentListings, type RecentListing } from "@/lib/data"
import { fmtUsd, timeAgo } from "@/lib/utils"
import { Clock } from "lucide-react"

const platformStyle: Record<string, string> = {
  TCGPlayer: "text-blue-400",
  CardMarket: "text-emerald-400",
  eBay: "text-amber-400",
}

export function RecentlyListed() {
  const [listings, setListings] = useState<RecentListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentListings().then((data) => {
      setListings(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <section className="border-y border-border/40 bg-secondary/20 py-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Recently Listed</h2>
            </div>
            <div className="rounded-xl border border-border/60 bg-card">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i !== 4 ? "border-b border-border/30" : ""}`}>
                  <div className="h-9 w-7 shrink-0 animate-pulse rounded bg-secondary" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-28 animate-pulse rounded bg-secondary" />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <div className="h-4 w-16 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-12 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="border-y border-border/40 bg-secondary/20 py-14">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Recently Listed</h2>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            {listings.map((listing, i) => (
              <div
                key={listing.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40 ${
                  i !== listings.length - 1 ? "border-b border-border/30" : ""
                }`}
              >
                {/* Card thumbnail placeholder */}
                <div className="h-9 w-7 shrink-0 rounded bg-secondary" />

                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {listing.name}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={platformStyle[listing.platform] ?? "text-muted-foreground"}>
                      {listing.platform}
                    </span>
                    <span className="text-border">{"/"}</span>
                    <span>{listing.condition}</span>
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-medium text-foreground">{fmtUsd(listing.price)}</div>
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo(listing.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
