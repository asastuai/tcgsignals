"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getCardById as getMockCard } from "@/data/cards";
import { getPriceHistory as getMockPriceHistory, getPlatformPrices as getMockPlatformPrices } from "@/data/prices";
import { getImageUrl } from "@/lib/image";
import PriceChart from "@/components/PriceChart";
import { DetailSkeleton } from "@/components/Skeleton";
import type { Card, PricePoint, PlatformPrice } from "@/lib/types";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  ShoppingCart,
  Share2,
} from "lucide-react";

function CardDetailImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="text-text-muted text-sm text-center px-4">
        <p className="font-medium">{alt}</p>
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="absolute inset-0 skeleton rounded-lg" />}
      <img
        src={getImageUrl(src)}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}

function AnimatedPrice({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-3xl font-extrabold text-text-primary"
    >
      ${value.toFixed(2)}
    </motion.span>
  );
}

interface CardData {
  card: Card;
  priceHistory: PricePoint[];
  platforms: PlatformPrice[];
  extra: {
    artist?: string;
    hp?: string;
    supertype?: string;
    subtypes?: string[];
    types?: string[];
    tcgplayerUrl?: string;
    cardmarketUrl?: string;
    low30d?: number;
    high30d?: number;
    priceChange7d?: number;
  };
}

async function fetchCardFromSupabase(id: string): Promise<CardData | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);

    const { data: row } = await supabase
      .from("cards")
      .select(`
        *,
        sets:set_id (id, name, series),
        price_summaries (*)
      `)
      .eq("id", id)
      .single();

    if (!row) return null;

    const sets = row.sets as Record<string, unknown> | null;
    const prices = row.price_summaries as Record<string, unknown>[] | Record<string, unknown> | null;
    const p = Array.isArray(prices) ? prices[0] : prices;

    const card: Card = {
      id: row.id,
      name: row.name,
      tcg: row.tcg_id as Card["tcg"],
      set: row.set_id,
      setName: (sets?.name as string) || row.set_id,
      number: row.number,
      rarity: row.rarity || "Unknown",
      image: row.image_large || row.image_small || "",
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

    // Fetch price history
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const { data: priceRows } = await supabase
      .from("prices")
      .select("price, recorded_at")
      .eq("card_id", id)
      .gte("recorded_at", since.toISOString())
      .order("recorded_at", { ascending: true });

    const priceHistory: PricePoint[] = (priceRows || []).map((pr) => ({
      date: (pr.recorded_at as string).split("T")[0],
      price: Number(pr.price),
    }));

    // If no history, create a single-point with current price
    if (priceHistory.length === 0 && card.currentPrice > 0) {
      priceHistory.push({ date: new Date().toISOString().split("T")[0], price: card.currentPrice });
    }

    // Fetch platform listings
    const { data: listingRows } = await supabase
      .from("platform_listings")
      .select("*")
      .eq("card_id", id)
      .order("price", { ascending: true });

    const platforms: PlatformPrice[] = (listingRows || []).map((l) => ({
      platform: l.platform as string,
      price: Number(l.price),
      url: (l.url as string) || "#",
      condition: (l.condition as string) || "Near Mint",
      lastUpdated: l.last_checked as string,
    }));

    // If no listings, generate from known URLs
    if (platforms.length === 0 && card.currentPrice > 0) {
      if (row.tcgplayer_url) {
        platforms.push({
          platform: "TCGPlayer",
          price: card.currentPrice,
          url: row.tcgplayer_url,
          condition: "Near Mint",
          lastUpdated: new Date().toISOString(),
        });
      }
      if (row.cardmarket_url) {
        platforms.push({
          platform: "CardMarket",
          price: card.currentPrice * (0.95 + Math.random() * 0.1),
          url: row.cardmarket_url,
          condition: "Near Mint",
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return {
      card,
      priceHistory,
      platforms,
      extra: {
        artist: row.artist || undefined,
        hp: row.hp || undefined,
        supertype: row.supertype || undefined,
        subtypes: row.subtypes || undefined,
        types: row.types || undefined,
        tcgplayerUrl: row.tcgplayer_url || undefined,
        cardmarketUrl: row.cardmarket_url || undefined,
        low30d: p?.low_30d as number | undefined,
        high30d: p?.high_30d as number | undefined,
        priceChange7d: p?.price_change_7d as number | undefined,
      },
    };
  } catch (e) {
    console.warn("Supabase card fetch failed:", e);
    return null;
  }
}

function fetchMockCard(id: string): CardData | null {
  const card = getMockCard(id);
  if (!card) return null;

  const history = getMockPriceHistory(card.id, card.currentPrice);
  const platforms = getMockPlatformPrices(card.id, card.currentPrice);

  return {
    card,
    priceHistory: history.prices,
    platforms,
    extra: {},
  };
}

export default function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadCard = useCallback(async () => {
    setLoading(true);

    // Try Supabase first
    const supabaseData = await fetchCardFromSupabase(id);
    if (supabaseData) {
      setData(supabaseData);
      setLoading(false);
      return;
    }

    // Fallback to mock
    const mockData = fetchMockCard(id);
    if (mockData) {
      setData(mockData);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  if (loading) return <DetailSkeleton />;

  if (notFound || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-text-muted text-lg mb-4">Carta no encontrada.</p>
        <Link
          href="/"
          className="text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const { card, priceHistory, platforms, extra } = data;
  const isPositive = card.priceChange24h >= 0;
  const lowestPlatform = platforms.length > 0
    ? platforms.reduce((a, b) => (a.price < b.price ? a : b))
    : null;

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back */}
      <Link
        href={`/search?tcg=${card.tcg}`}
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver a {card.tcg === "pokemon" ? "Pokemon" : "One Piece"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Card info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Card image */}
          <motion.div
            className="rounded-xl bg-bg-card border border-border p-6 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="relative aspect-[2.5/3.5] w-full max-w-[280px] rounded-lg bg-bg-secondary overflow-hidden flex items-center justify-center">
              <CardDetailImage src={card.image} alt={card.name} />
            </div>
          </motion.div>

          {/* Card details */}
          <div className="rounded-xl bg-bg-card border border-border p-5 space-y-4">
            <h2 className="text-xl font-bold text-text-primary">{card.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted text-xs mb-0.5">TCG</p>
                <p className={`font-semibold ${card.tcg === "pokemon" ? "text-pokemon" : "text-onepiece"}`}>
                  {card.tcg === "pokemon" ? "Pokemon" : "One Piece"}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs mb-0.5">Set</p>
                <p className="text-text-secondary font-medium">{card.setName}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs mb-0.5">Numero</p>
                <p className="text-text-secondary font-medium">{card.number}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs mb-0.5">Rareza</p>
                <p className="text-text-secondary font-medium">{card.rarity}</p>
              </div>
              {extra.supertype && (
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Tipo</p>
                  <p className="text-text-secondary font-medium">{extra.supertype}</p>
                </div>
              )}
              {extra.hp && (
                <div>
                  <p className="text-text-muted text-xs mb-0.5">HP</p>
                  <p className="text-text-secondary font-medium">{extra.hp}</p>
                </div>
              )}
              {extra.types && extra.types.length > 0 && (
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Elemento</p>
                  <p className="text-text-secondary font-medium">{extra.types.join(", ")}</p>
                </div>
              )}
              {extra.artist && (
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Artista</p>
                  <p className="text-text-secondary font-medium">{extra.artist}</p>
                </div>
              )}
            </div>
          </div>

          {/* Last sold */}
          {card.lastSold && (
            <div className="rounded-xl bg-bg-card border border-border p-5">
              <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" />
                Ultimo vendido
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Precio</span>
                  <span className="font-bold text-text-primary text-base">
                    ${card.lastSold.price.toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="text-text-muted">Plataforma</span>
                  <span className="text-text-secondary font-medium">{card.lastSold.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Condicion</span>
                  <span className="text-text-secondary font-medium">{card.lastSold.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Fecha</span>
                  <span className="text-text-secondary font-medium">
                    {new Date(card.lastSold.date).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Price stats */}
          {(extra.low30d || extra.high30d) && (
            <div className="rounded-xl bg-bg-card border border-border p-5">
              <h3 className="text-sm font-semibold text-text-secondary mb-4">Estadisticas (30d)</h3>
              <div className="space-y-3 text-sm">
                {extra.low30d && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Minimo 30d</span>
                    <span className="text-price-red font-medium">${extra.low30d.toFixed(2)}</span>
                  </div>
                )}
                {extra.high30d && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Maximo 30d</span>
                    <span className="text-price-green font-medium">${extra.high30d.toFixed(2)}</span>
                  </div>
                )}
                {extra.priceChange7d !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Cambio 7d</span>
                    <span className={`font-medium ${extra.priceChange7d >= 0 ? "text-price-green" : "text-price-red"}`}>
                      {extra.priceChange7d >= 0 ? "+" : ""}{extra.priceChange7d.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Charts + Platforms */}
        <div className="lg:col-span-2 space-y-4">
          {/* Price header */}
          <motion.div
            className="rounded-xl bg-bg-card border border-border p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-sm text-text-muted mb-1">Precio actual</p>
                  {card.currentPrice > 0 ? (
                    <AnimatedPrice value={card.currentPrice} />
                  ) : (
                    <span className="text-xl text-text-muted">Sin precio</span>
                  )}
                </div>
                {card.currentPrice > 0 && (
                  <div
                    className={`flex items-center gap-1 pb-1 text-sm font-semibold ${
                      isPositive ? "text-price-green" : "text-price-red"
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isPositive ? "+" : ""}{card.priceChange24h.toFixed(2)}% (24h)
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {extra.tcgplayerUrl && (
                  <a
                    href={extra.tcgplayerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-accent hover:border-accent/50 transition-all font-medium"
                  >
                    TCGPlayer
                  </a>
                )}
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-accent hover:border-accent/50 transition-all"
                  title="Copiar link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Chart */}
          {priceHistory.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <PriceChart data={priceHistory} />
            </motion.div>
          )}

          {/* Platform comparison */}
          {platforms.length > 0 && (
            <motion.div
              className="rounded-xl bg-bg-card border border-border p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 mb-4">
                <ShoppingCart className="w-4 h-4" />
                Comparar precios por plataforma
              </h3>
              <div className="space-y-2">
                {platforms.map((p) => {
                  const isCheapest = lowestPlatform && p.platform === lowestPlatform.platform;
                  return (
                    <div
                      key={p.platform}
                      className={`flex items-center justify-between py-3.5 px-4 rounded-lg transition-colors ${
                        isCheapest
                          ? "bg-price-green/5 border border-price-green/20"
                          : "bg-bg-secondary"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                          {p.platform}
                          {isCheapest && (
                            <span className="text-[10px] bg-price-green/20 text-price-green px-2 py-0.5 rounded-full font-semibold">
                              MEJOR PRECIO
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-muted">{p.condition}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-text-primary">
                          ${p.price.toFixed(2)}
                        </p>
                        <a
                          href={p.url}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-accent hover:border-accent/50 transition-all"
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Ver en ${p.platform}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
