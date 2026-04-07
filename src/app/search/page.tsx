"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import { searchCards, getCardsByTcg, getTrendingCards, cards as allMockCards } from "@/data/cards";
import { tcgs } from "@/data/tcgs";
import CardGrid from "@/components/CardGrid";
import Pagination from "@/components/Pagination";
import { CardGridSkeleton } from "@/components/Skeleton";
import { Filter, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import type { Card } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "", label: "Relevancia" },
  { value: "price-desc", label: "Precio: Mayor a menor" },
  { value: "price-asc", label: "Precio: Menor a mayor" },
  { value: "change-desc", label: "Mayor suba (24h)" },
  { value: "change-asc", label: "Mayor baja (24h)" },
  { value: "name-asc", label: "Nombre: A-Z" },
  { value: "name-desc", label: "Nombre: Z-A" },
];

const PAGE_SIZE = 48;

// Convert Supabase card to the Card type used by CardGrid
function mapSupabaseCard(row: Record<string, unknown>): Card {
  const sets = row.sets as Record<string, unknown> | null;
  const prices = row.price_summaries as Record<string, unknown>[] | Record<string, unknown> | null;
  const p = Array.isArray(prices) ? prices[0] : prices;

  return {
    id: row.id as string,
    name: row.name as string,
    tcg: row.tcg_id as Card["tcg"],
    set: row.set_id as string,
    setName: sets?.name as string || row.set_id as string,
    number: row.number as string,
    rarity: row.rarity as string || "Unknown",
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

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();

  const q = params.get("q") || "";
  const tcg = params.get("tcg") || "";
  const view = params.get("view") || "";
  const rarity = params.get("rarity") || "";
  const sort = params.get("sort") || "";
  const pageParam = parseInt(params.get("page") || "1", 10);

  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rarities, setRarities] = useState<string[]>([]);
  const [useSupabase, setUseSupabase] = useState(false);

  // Use params string as a stable key for refetching
  const paramsKey = params.toString();

  const fetchCards = useCallback(async () => {
    setLoading(true);

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, supabaseKey);
        setUseSupabase(true);

        const from = (pageParam - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const select = `
          id, name, tcg_id, set_id, number, rarity, image_small, image_large,
          sets:set_id (id, name),
          price_summaries (current_price, previous_price, price_change_24h, last_sold_price, last_sold_platform, last_sold_date, last_sold_condition)
        `;

        let query = supabase.from("cards").select(select, { count: "exact" });

        if (q) {
          query = query.textSearch("search_vector", q, { type: "websearch" });
        }
        if (tcg) {
          query = query.eq("tcg_id", tcg);
        }
        if (rarity) {
          query = query.eq("rarity", rarity);
        }

        // Sort
        switch (sort) {
          case "name-asc": query = query.order("name", { ascending: true }); break;
          case "name-desc": query = query.order("name", { ascending: false }); break;
          default: query = query.order("name", { ascending: true });
        }

        query = query.range(from, to);
        const { data, count } = await query;

        if (data) {
          let mapped = data.map((r) => mapSupabaseCard(r as unknown as Record<string, unknown>));

          // Client-side sort for price-based sorts (can't sort by joined table in Supabase)
          switch (sort) {
            case "price-desc":
              mapped.sort((a, b) => b.currentPrice - a.currentPrice);
              break;
            case "price-asc":
              mapped.sort((a, b) => (a.currentPrice || Infinity) - (b.currentPrice || Infinity));
              break;
            case "change-desc":
              mapped.sort((a, b) => b.priceChange24h - a.priceChange24h);
              break;
            case "change-asc":
              mapped.sort((a, b) => a.priceChange24h - b.priceChange24h);
              break;
          }

          // Default: cards with price first
          if (!sort) {
            mapped.sort((a, b) => (b.currentPrice > 0 ? 1 : 0) - (a.currentPrice > 0 ? 1 : 0));
          }

          setCards(mapped);
          setTotal(count || 0);
          setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
        }

        // Fetch rarities for filter
        const { data: rarityData } = await supabase
          .from("cards")
          .select("rarity")
          .not("rarity", "is", null)
          .eq("tcg_id", tcg || "pokemon");

        if (rarityData) {
          const unique = [...new Set(rarityData.map((r) => r.rarity as string))].sort();
          setRarities(unique);
        }

        setLoading(false);
        return;
      } catch (e) {
        console.warn("Supabase fetch failed, falling back to mock:", e);
      }
    }

    // Fallback to mock data
    setUseSupabase(false);
    let results = allMockCards;

    if (q) results = searchCards(q);
    else if (tcg) results = getCardsByTcg(tcg);
    else if (view === "trending") results = getTrendingCards();

    if (rarity) results = results.filter((c) => c.rarity === rarity);

    if (sort) {
      results = [...results].sort((a, b) => {
        switch (sort) {
          case "price-desc": return b.currentPrice - a.currentPrice;
          case "price-asc": return a.currentPrice - b.currentPrice;
          case "change-desc": return b.priceChange24h - a.priceChange24h;
          case "change-asc": return a.priceChange24h - b.priceChange24h;
          case "name-asc": return a.name.localeCompare(b.name);
          case "name-desc": return b.name.localeCompare(a.name);
          default: return 0;
        }
      });
    }

    setCards(results);
    setTotal(results.length);
    setTotalPages(1);
    setRarities([...new Set(allMockCards.map((c) => c.rarity))]);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  function updateParam(key: string, value: string) {
    const newParams = new URLSearchParams(params.toString());
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset page when changing filters
    if (key !== "page") {
      newParams.delete("page");
    }
    router.replace(`/search?${newParams.toString()}`);
  }

  const title = q
    ? `Resultados para "${q}"`
    : tcg
      ? tcgs.find((t) => t.id === tcg)?.name || tcg
      : view === "trending"
        ? "Trending ahora"
        : "Todas las cartas";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="text-sm text-text-muted mt-1">
            {total.toLocaleString()} resultado{total !== 1 ? "s" : ""}
            {useSupabase && <span className="text-accent ml-2">LIVE</span>}
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <Link
              href="/search"
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                !tcg
                  ? "bg-accent text-white border-accent"
                  : "border-border text-text-muted hover:text-text-secondary hover:border-accent/30"
              }`}
            >
              Todas
            </Link>
            {tcgs.map((t) => (
              <Link
                key={t.id}
                href={`/search?tcg=${t.id}`}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                  tcg === t.id
                    ? "bg-accent text-white border-accent"
                    : "border-border text-text-muted hover:text-text-secondary hover:border-accent/30"
                }`}
              >
                {t.name.split(" ")[0]}
              </Link>
            ))}
          </div>

          <div className="h-5 w-px bg-border hidden sm:block" />

          <div className="relative">
            <select
              value={rarity}
              onChange={(e) => updateParam("rarity", e.target.value)}
              className="appearance-none bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent cursor-pointer pr-8 transition-colors"
            >
              <option value="">Todas las rarezas</option>
              {rarities.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="appearance-none bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent cursor-pointer pr-8 transition-colors"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={PAGE_SIZE} />
      ) : (
        <>
          <CardGrid cards={cards} />
          <Pagination
            page={pageParam}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => updateParam("page", String(p))}
          />
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <CardGridSkeleton count={PAGE_SIZE} />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
