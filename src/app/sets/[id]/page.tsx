"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Hash, Filter, ArrowUpDown } from "lucide-react";
import CardGrid from "@/components/CardGrid";
import Pagination from "@/components/Pagination";
import { CardGridSkeleton, Skeleton } from "@/components/Skeleton";
import type { Card } from "@/lib/types";

const PAGE_SIZE = 48;

const SORT_OPTIONS = [
  { value: "", label: "Numero" },
  { value: "price-desc", label: "Precio: Mayor" },
  { value: "price-asc", label: "Precio: Menor" },
  { value: "name-asc", label: "A-Z" },
];

interface SetInfo {
  id: string;
  name: string;
  tcg_id: string;
  card_count: number;
  release_date: string | null;
  image_url: string | null;
  series: string | null;
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

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [setInfo, setSetInfo] = useState<SetInfo | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("");
  const [rarity, setRarity] = useState("");
  const [rarities, setRarities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) { setLoading(false); return; }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);

    // Fetch set info
    if (!setInfo) {
      const { data: s } = await supabase.from("sets").select("*").eq("id", id).single();
      if (s) setSetInfo(s as SetInfo);
    }

    // Fetch cards
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const select = `
      id, name, tcg_id, set_id, number, rarity, image_small, image_large,
      sets:set_id (id, name),
      price_summaries (current_price, previous_price, price_change_24h, last_sold_price, last_sold_platform, last_sold_date, last_sold_condition)
    `;

    let query = supabase.from("cards").select(select, { count: "exact" }).eq("set_id", id);

    if (rarity) query = query.eq("rarity", rarity);

    switch (sort) {
      case "name-asc": query = query.order("name", { ascending: true }); break;
      default: query = query.order("number", { ascending: true });
    }

    query = query.range(from, to);
    const { data, count } = await query;

    if (data) {
      let mapped = data.map((r) => mapRow(r as unknown as Record<string, unknown>));

      if (sort === "price-desc") mapped.sort((a, b) => b.currentPrice - a.currentPrice);
      if (sort === "price-asc") mapped.sort((a, b) => (a.currentPrice || Infinity) - (b.currentPrice || Infinity));

      setCards(mapped);
      setTotal(count || 0);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
    }

    // Rarities
    if (rarities.length === 0) {
      const { data: rd } = await supabase
        .from("cards")
        .select("rarity")
        .eq("set_id", id)
        .not("rarity", "is", null);
      if (rd) {
        setRarities([...new Set(rd.map((r) => r.rarity as string))].sort());
      }
    }

    setLoading(false);
  }, [id, page, sort, rarity, setInfo, rarities.length]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/sets"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Todos los sets
      </Link>

      {/* Set header */}
      <motion.div
        className="rounded-xl bg-bg-card border border-border p-6 mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {setInfo ? (
          <div className="flex items-start gap-4">
            {setInfo.image_url ? (
              <img src={setInfo.image_url} alt={setInfo.name} className="h-14 object-contain shrink-0" />
            ) : (
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                setInfo.tcg_id === "pokemon" ? "bg-pokemon/20 text-pokemon" : "bg-onepiece/20 text-onepiece"
              }`}>
                {setInfo.tcg_id === "pokemon" ? "PKM" : "OP"}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-text-primary">{setInfo.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-muted">
                {setInfo.series && <span>{setInfo.series}</span>}
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />
                  {setInfo.card_count} cartas
                </span>
                {setInfo.release_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(setInfo.release_date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <Skeleton className="w-14 h-14 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <select
            value={rarity}
            onChange={(e) => { setRarity(e.target.value); setPage(1); }}
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
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="appearance-none bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent cursor-pointer pr-8 transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
        </div>

        <span className="text-xs text-text-muted">
          {total} cartas
        </span>
      </div>

      {/* Cards grid */}
      {loading ? (
        <CardGridSkeleton count={PAGE_SIZE} />
      ) : (
        <>
          <CardGrid cards={cards} />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
