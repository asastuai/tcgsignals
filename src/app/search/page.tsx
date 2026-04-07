"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import { getCards, getRarities, getTcgs, toCard } from "@/lib/queries/cards";
import type { SortOption } from "@/lib/queries/cards";
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

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const paramsKey = params.toString();

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
  const [tcgInfos, setTcgInfos] = useState<{ id: string; name: string }[]>([
    { id: "pokemon", name: "Pokemon" },
    { id: "onepiece", name: "One Piece" },
  ]);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCards({
        tcg: tcg || undefined,
        search: q || undefined,
        rarity: rarity || undefined,
        sort: (sort || (view === "trending" ? "price-desc" : "")) as SortOption,
        page: pageParam,
        pageSize: PAGE_SIZE,
      });

      setCards(result.data.map(toCard));
      setTotal(result.total);
      setTotalPages(result.totalPages);

      // Fetch rarities (no hardcoded TCG)
      const rarityList = await getRarities(tcg || undefined);
      setRarities(rarityList);

      // Fetch TCG names
      const tcgs = await getTcgs();
      if (tcgs.length > 0) {
        setTcgInfos(tcgs.map((t) => ({ id: t.id, name: t.id === "onepiece" ? "One Piece" : t.name.replace(" TCG", "") })));
      }
    } catch (e) {
      console.warn("Search fetch failed:", e);
      setCards([]);
      setTotal(0);
      setTotalPages(0);
    }
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
    if (key !== "page") newParams.delete("page");
    router.replace(`/search?${newParams.toString()}`);
  }

  const title = q
    ? `Resultados para "${q}"`
    : tcg
      ? tcgInfos.find((t) => t.id === tcg)?.name || tcg
      : view === "trending"
        ? "Trending ahora"
        : "Todas las cartas";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="text-sm text-text-muted mt-1">
            {total.toLocaleString()} resultado{total !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <Link
              href="/search"
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                !tcg ? "bg-accent text-white border-accent" : "border-border text-text-muted hover:border-accent/30"
              }`}
            >
              Todas
            </Link>
            {tcgInfos.map((t) => (
              <Link
                key={t.id}
                href={`/search?tcg=${t.id}`}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                  tcg === t.id ? "bg-accent text-white border-accent" : "border-border text-text-muted hover:border-accent/30"
                }`}
              >
                {t.name}
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
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><CardGridSkeleton count={PAGE_SIZE} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
