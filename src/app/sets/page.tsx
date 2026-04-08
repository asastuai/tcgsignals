"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, Calendar, Hash } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import { getSets } from "@/lib/queries/cards";

interface SetData {
  id: string;
  tcg_id: string;
  name: string;
  code: string | null;
  release_date: string | null;
  card_count: number;
  image_url: string | null;
  series: string | null;
}

export default function SetsPage() {
  const [sets, setSets] = useState<SetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    async function load() {
      const data = await getSets();
      setSets(data as SetData[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter ? sets.filter((s) => s.tcg_id === filter) : sets;

  const grouped: Record<string, SetData[]> = {};
  for (const s of filtered) {
    const key = s.series || "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }

  const tcgCounts = {
    all: sets.length,
    pokemon: sets.filter((s) => s.tcg_id === "pokemon").length,
    onepiece: sets.filter((s) => s.tcg_id === "onepiece").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Layers className="w-6 h-6 text-accent" />
              Sets
            </h1>
            <p className="text-sm text-text-muted mt-1">{filtered.length} sets disponibles</p>
          </div>
          <div className="flex gap-2">
            {[
              { key: "", label: `Todos (${tcgCounts.all})` },
              { key: "pokemon", label: `Pokemon (${tcgCounts.pokemon})` },
              { key: "onepiece", label: `One Piece (${tcgCounts.onepiece})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                  filter === f.key ? "bg-accent text-white border-accent" : "border-border text-text-muted hover:border-accent/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-bg-card border border-border p-4">
                <Skeleton className="h-12 w-12 rounded-lg mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          Object.entries(grouped).map(([series, seriesSets]) => (
            <div key={series} className="mb-10">
              <h2 className="text-lg font-semibold text-text-secondary mb-4">{series}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {seriesSets.map((set, i) => (
                  <motion.div
                    key={set.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  >
                    <Link href={`/sets/${set.id}`}>
                      <div className="rounded-xl bg-bg-card border border-border p-4 card-hover card-glow cursor-pointer group">
                        {set.image_url ? (
                          <img src={set.image_url} alt={set.name} className="h-10 mb-3 object-contain" loading="lazy" />
                        ) : (
                          <div className={`h-10 rounded-lg mb-3 flex items-center gap-2 px-2 text-xs font-bold ${
                            set.tcg_id === "pokemon" ? "bg-pokemon/20 text-pokemon" : "bg-onepiece/20 text-onepiece"
                          }`}>
                            <span className="text-base">{set.tcg_id === "pokemon" ? "PKM" : "OP"}</span>
                            <span className="text-[10px] font-normal text-text-muted opacity-60 truncate">{set.code || set.id}</span>
                          </div>
                        )}
                        <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                          {set.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                          <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{set.card_count} cartas</span>
                          {set.release_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(set.release_date).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
}
