"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Hash, Filter, ArrowUpDown } from "lucide-react";
import { getCards, getRarities, getSetById, toCard } from "@/lib/queries/cards";
import type { SortOption } from "@/lib/queries/cards";
import CardGrid from "@/components/CardGrid";
import Pagination from "@/components/Pagination";
import { CardGridSkeleton, Skeleton } from "@/components/Skeleton";
import type { Card } from "@/lib/types";

const PAGE_SIZE = 48;

const SORT_OPTIONS = [
  { value: "number-asc", label: "Numero" },
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

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [setInfo, setSetInfo] = useState<SetInfo | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string>("number-asc");
  const [rarity, setRarity] = useState("");
  const [rarities, setRarities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch set info (only once)
      if (!setInfo) {
        const s = await getSetById(id);
        if (s) setSetInfo(s as SetInfo);
      }

      // Fetch cards
      const result = await getCards({
        setId: id,
        sort: (sort || "number-asc") as SortOption,
        rarity: rarity || undefined,
        page,
        pageSize: PAGE_SIZE,
      });

      setCards(result.data.map(toCard));
      setTotal(result.total);
      setTotalPages(result.totalPages);

      // Rarities for this set
      if (rarities.length === 0) {
        // Get rarities from all cards in this set (query without rarity filter)
        const allRarities = await getRarities();
        setRarities(allRarities);
      }
    } catch (e) {
      console.warn("Set detail fetch failed:", e);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, sort, rarity]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/sets"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Todos los sets
      </Link>

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
                <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{setInfo.card_count} cartas</span>
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
            <div><Skeleton className="h-6 w-48 mb-2" /><Skeleton className="h-4 w-32" /></div>
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <select
            value={rarity}
            onChange={(e) => { setRarity(e.target.value); setPage(1); }}
            className="appearance-none bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent cursor-pointer pr-8 transition-colors"
          >
            <option value="">Todas las rarezas</option>
            {rarities.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
          <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="appearance-none bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent cursor-pointer pr-8 transition-colors"
          >
            {SORT_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
          <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
        </div>
        <span className="text-xs text-text-muted">{total} cartas</span>
      </div>

      {loading ? (
        <CardGridSkeleton count={PAGE_SIZE} />
      ) : (
        <>
          <CardGrid cards={cards} />
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
