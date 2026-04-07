"use client";

import Link from "next/link";
import { Search, TrendingUp, TrendingDown, Zap, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getTrendingCards as getMockTrending, getTopGainers as getMockGainers, getTopLosers as getMockLosers } from "@/data/cards";
import CardGrid from "@/components/CardGrid";
import { CardGridSkeleton, Skeleton } from "@/components/Skeleton";
import type { Card } from "@/lib/types";

interface TCGInfo {
  id: string;
  name: string;
  color: string;
  card_count: number;
}

function mapRow(row: Record<string, unknown>): Card {
  const sets = row.sets as Record<string, unknown> | null;
  const prices = row.price_summaries as Record<string, unknown>[] | Record<string, unknown> | null;
  const p = Array.isArray(prices) ? prices[0] : prices;

  return {
    id: row.id as string,
    name: row.name as string,
    tcg: row.tcg_id as Card["tcg"],
    set: row.set_id as string,
    setName: (sets?.name as string) || row.set_id as string,
    number: row.number as string,
    rarity: (row.rarity as string) || "Unknown",
    image: (row.image_large || row.image_small || "") as string,
    currentPrice: (p?.current_price as number) || 0,
    previousPrice: (p?.previous_price as number) || 0,
    priceChange24h: (p?.price_change_24h as number) || 0,
    lastSold: p?.last_sold_price
      ? {
          price: p.last_sold_price as number,
          platform: (p.last_sold_platform as string) || "",
          date: (p.last_sold_date as string) || "",
          condition: (p.last_sold_condition as string) || "Near Mint",
        }
      : undefined,
  };
}

function GainerLoserTable({
  title,
  cards,
  type,
  loading,
}: {
  title: string;
  cards: Card[];
  type: "gainer" | "loser";
  loading: boolean;
}) {
  const Icon = type === "gainer" ? TrendingUp : TrendingDown;
  const color = type === "gainer" ? "text-price-green" : "text-price-red";

  return (
    <div className="rounded-xl bg-bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        {title}
      </h3>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {cards.map((card, i) => (
            <Link
              key={card.id}
              href={`/card/${card.id}`}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-hover transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xs text-text-muted font-mono w-4">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                    {card.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {card.tcg === "pokemon" ? "PKM" : "OP"} &middot; {card.setName}
                  </p>
                </div>
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-sm font-bold text-text-primary">
                  {card.currentPrice > 0 ? `$${card.currentPrice.toFixed(2)}` : "—"}
                </p>
                <p className={`text-xs font-semibold ${color}`}>
                  {card.priceChange24h > 0 ? "+" : ""}
                  {card.priceChange24h.toFixed(2)}%
                </p>
              </div>
            </Link>
          ))}
          {cards.length === 0 && (
            <p className="text-text-muted text-sm text-center py-4">Sin datos aun</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const [tcgInfos, setTcgInfos] = useState<TCGInfo[]>([
    { id: "pokemon", name: "Pokemon TCG", color: "#FFCB05", card_count: 0 },
    { id: "onepiece", name: "One Piece TCG", color: "#E21B26", card_count: 0 },
  ]);
  const [trending, setTrending] = useState<Card[]>([]);
  const [gainers, setGainers] = useState<Card[]>([]);
  const [losers, setLosers] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (url && key) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(url, key);

          const select = `
            id, name, tcg_id, set_id, number, rarity, image_small, image_large,
            sets:set_id (id, name),
            price_summaries (current_price, previous_price, price_change_24h, last_sold_price, last_sold_platform, last_sold_date, last_sold_condition)
          `;

          // Fetch TCG card counts
          const { data: tcgRows } = await supabase.from("tcgs").select("*");
          if (tcgRows) {
            setTcgInfos(tcgRows.map((t) => ({
              id: t.id as string,
              name: t.name as string,
              color: (t.color as string) || "#6c5ce7",
              card_count: (t.card_count as number) || 0,
            })));
          }

          // Top priced cards as "trending" (cards with highest prices)
          const { data: trendingData } = await supabase
            .from("cards")
            .select(select)
            .not("price_summaries.current_price", "is", null)
            .order("name")
            .limit(12);

          // For gainers/losers we need to query price_summaries first
          const { data: gainerIds } = await supabase
            .from("price_summaries")
            .select("card_id, price_change_24h")
            .not("current_price", "is", null)
            .gt("current_price", 0)
            .order("price_change_24h", { ascending: false })
            .limit(5);

          const { data: loserIds } = await supabase
            .from("price_summaries")
            .select("card_id, price_change_24h")
            .not("current_price", "is", null)
            .gt("current_price", 0)
            .order("price_change_24h", { ascending: true })
            .limit(5);

          if (trendingData) {
            setTrending(trendingData.map((r) => mapRow(r as unknown as Record<string, unknown>)));
          }

          if (gainerIds?.length) {
            const { data } = await supabase
              .from("cards")
              .select(select)
              .in("id", gainerIds.map((g) => g.card_id));
            if (data) setGainers(data.map((r) => mapRow(r as unknown as Record<string, unknown>)));
          }

          if (loserIds?.length) {
            const { data } = await supabase
              .from("cards")
              .select(select)
              .in("id", loserIds.map((l) => l.card_id));
            if (data) setLosers(data.map((r) => mapRow(r as unknown as Record<string, unknown>)));
          }

          setLoading(false);
          return;
        } catch (e) {
          console.warn("Supabase home fetch failed:", e);
        }
      }

      // Fallback mock
      setTrending(getMockTrending());
      setGainers(getMockGainers());
      setLosers(getMockLosers());
      setLoading(false);
    }

    load();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <motion.section
        className="text-center py-16 md:py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3 mb-5">
          <Zap className="w-10 h-10 text-accent" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            TCG<span className="text-accent">Signals</span>
          </h1>
        </div>
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Precios en tiempo real para tus cartas coleccionables. Pokemon, One
          Piece y mas.
        </p>
        <form onSubmit={handleSearch} className="max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar carta, set o booster box..."
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-base transition-all shadow-lg shadow-black/10"
          />
        </form>
      </motion.section>

      {/* TCG selector */}
      <motion.section
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {tcgInfos.map((tcg) => (
          <Link key={tcg.id} href={`/search?tcg=${tcg.id}`}>
            <div
              className="rounded-xl border border-border p-6 card-hover card-glow transition-all cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${tcg.color}08 0%, transparent 60%)`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
                    {tcg.name}
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    {tcg.card_count > 0
                      ? `${tcg.card_count.toLocaleString()} cartas`
                      : "Cargando..."}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </motion.section>

      {/* Gainers / Losers */}
      <motion.section
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <GainerLoserTable title="Top Gainers (24h)" cards={gainers} type="gainer" loading={loading} />
        <GainerLoserTable title="Top Losers (24h)" cards={losers} type="loser" loading={loading} />
      </motion.section>

      {/* Trending */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        {loading ? (
          <>
            <h2 className="text-xl font-bold text-text-primary mb-5">Cartas destacadas</h2>
            <CardGridSkeleton count={6} />
          </>
        ) : (
          <CardGrid cards={trending} title="Cartas destacadas" />
        )}
      </motion.section>
    </div>
  );
}
