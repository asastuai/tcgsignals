"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getCardById, getPriceHistory, getPlatformListings, toCard, toCardExtra } from "@/lib/queries/cards";
import type { CardExtra } from "@/lib/queries/cards";
import { getImageUrl } from "@/lib/image";
import PriceChart from "@/components/PriceChart";
import { DetailSkeleton } from "@/components/Skeleton";
import type { Card, PricePoint, PlatformPrice } from "@/lib/types";
import {
  ArrowLeft, TrendingUp, TrendingDown, Clock,
  ExternalLink, ShoppingCart, Share2, Info,
} from "lucide-react";

function CardDetailImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return <div className="text-text-muted text-sm text-center px-4"><p className="font-medium">{alt}</p></div>;
  }

  return (
    <>
      {!loaded && <div className="absolute inset-0 skeleton rounded-lg" />}
      <img
        src={getImageUrl(src)}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

export default function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [card, setCard] = useState<Card | null>(null);
  const [extra, setExtra] = useState<CardExtra>({});
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [platforms, setPlatforms] = useState<PlatformPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadCard = useCallback(async () => {
    setLoading(true);
    try {
      const row = await getCardById(id);
      if (!row) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCard(toCard(row));
      setExtra(toCardExtra(row));

      const [history, listings] = await Promise.all([
        getPriceHistory(id),
        getPlatformListings(id),
      ]);

      setPriceHistory(history);
      setPlatforms(listings);
    } catch (e) {
      console.warn("Card fetch failed:", e);
      setNotFound(true);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadCard(); }, [loadCard]);

  if (loading) return <DetailSkeleton />;

  if (notFound || !card) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-text-muted text-lg mb-4">Carta no encontrada.</p>
        <Link href="/" className="text-accent hover:text-accent-hover font-medium transition-colors">Volver al inicio</Link>
      </div>
    );
  }

  const isPositive = (card.priceChange24h ?? 0) >= 0;
  const lowestPlatform = platforms.length > 0 ? platforms.reduce((a, b) => (a.price < b.price ? a : b)) : null;

  return (
    <motion.div className="max-w-7xl mx-auto px-4 py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Link
        href={`/search?tcg=${card.tcg}`}
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver a {card.tcg === "pokemon" ? "Pokemon" : "One Piece"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div className="rounded-xl bg-bg-card border border-border p-6 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <div className="relative aspect-[5/7] w-full max-w-[280px] rounded-lg bg-bg-secondary overflow-hidden flex items-center justify-center">
              <CardDetailImage src={card.image} alt={card.name} />
            </div>
          </motion.div>

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
              {extra.supertype && <div><p className="text-text-muted text-xs mb-0.5">Tipo</p><p className="text-text-secondary font-medium">{extra.supertype}</p></div>}
              {extra.hp && <div><p className="text-text-muted text-xs mb-0.5">HP</p><p className="text-text-secondary font-medium">{extra.hp}</p></div>}
              {extra.types && extra.types.length > 0 && <div><p className="text-text-muted text-xs mb-0.5">Elemento</p><p className="text-text-secondary font-medium">{extra.types.join(", ")}</p></div>}
              {extra.artist && <div><p className="text-text-muted text-xs mb-0.5">Artista</p><p className="text-text-secondary font-medium">{extra.artist}</p></div>}
            </div>
          </div>

          {card.lastSold && (
            <div className="rounded-xl bg-bg-card border border-border p-5">
              <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" />Ultimo vendido
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Precio</span>
                  <span className="font-bold text-text-primary text-base">${card.lastSold.price.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border" />
                {card.lastSold.platform && <div className="flex justify-between"><span className="text-text-muted">Plataforma</span><span className="text-text-secondary font-medium">{card.lastSold.platform}</span></div>}
                <div className="flex justify-between"><span className="text-text-muted">Condicion</span><span className="text-text-secondary font-medium">{card.lastSold.condition}</span></div>
                {card.lastSold.date && <div className="flex justify-between"><span className="text-text-muted">Fecha</span><span className="text-text-secondary font-medium">{new Date(card.lastSold.date).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>}
              </div>
            </div>
          )}

          {(extra.low30d || extra.high30d) && (
            <div className="rounded-xl bg-bg-card border border-border p-5">
              <h3 className="text-sm font-semibold text-text-secondary mb-4">Estadisticas (30d)</h3>
              <div className="space-y-3 text-sm">
                {extra.low30d != null && <div className="flex justify-between"><span className="text-text-muted">Minimo</span><span className="text-price-red font-medium">${extra.low30d.toFixed(2)}</span></div>}
                {extra.high30d != null && <div className="flex justify-between"><span className="text-text-muted">Maximo</span><span className="text-price-green font-medium">${extra.high30d.toFixed(2)}</span></div>}
                {extra.priceChange7d != null && <div className="flex justify-between"><span className="text-text-muted">Cambio 7d</span><span className={`font-medium ${extra.priceChange7d >= 0 ? "text-price-green" : "text-price-red"}`}>{extra.priceChange7d >= 0 ? "+" : ""}{extra.priceChange7d.toFixed(2)}%</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div className="rounded-xl bg-bg-card border border-border p-5"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-sm text-text-muted mb-1">Precio actual</p>
                  {card.currentPrice != null ? (
                    <motion.span key={card.currentPrice} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-3xl font-extrabold text-text-primary">
                      ${card.currentPrice.toFixed(2)}
                    </motion.span>
                  ) : (
                    <span className="text-xl text-text-muted">Sin precio</span>
                  )}
                </div>
                {card.priceChange24h != null && card.priceChange24h !== 0 && (
                  <div className={`flex items-center gap-1 pb-1 text-sm font-semibold ${isPositive ? "text-price-green" : "text-price-red"}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isPositive ? "+" : ""}{card.priceChange24h.toFixed(2)}% (24h)
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {extra.tcgplayerUrl && (
                  <a href={extra.tcgplayerUrl} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-accent hover:border-accent/50 transition-all font-medium">
                    TCGPlayer
                  </a>
                )}
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-accent hover:border-accent/50 transition-all"
                  title="Copiar link">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {priceHistory.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
              <PriceChart data={priceHistory} />
            </motion.div>
          )}

          {/* Platform comparison — NO FAKE DATA */}
          <motion.div className="rounded-xl bg-bg-card border border-border p-5"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 mb-4">
              <ShoppingCart className="w-4 h-4" />Comparar precios por plataforma
            </h3>
            {platforms.length > 0 ? (
              <div className="space-y-2">
                {platforms.map((p) => {
                  const isCheapest = lowestPlatform && p.platform === lowestPlatform.platform;
                  return (
                    <div key={`${p.platform}-${p.condition}`}
                      className={`flex items-center justify-between py-3.5 px-4 rounded-lg transition-colors ${
                        isCheapest ? "bg-price-green/5 border border-price-green/20" : "bg-bg-secondary"
                      }`}>
                      <div>
                        <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                          {p.platform}
                          {isCheapest && <span className="text-[10px] bg-price-green/20 text-price-green px-2 py-0.5 rounded-full font-semibold">MEJOR PRECIO</span>}
                        </p>
                        <p className="text-xs text-text-muted">{p.condition}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-text-primary">${p.price.toFixed(2)}</p>
                        <a href={p.url} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-accent hover:border-accent/50 transition-all"
                          target="_blank" rel="noopener noreferrer" title={`Ver en ${p.platform}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-text-muted py-4">
                <Info className="w-4 h-4" />
                Sin datos de plataformas disponibles
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
