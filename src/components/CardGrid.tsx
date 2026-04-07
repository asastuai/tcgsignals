"use client";

import Link from "next/link";
import { Card } from "@/lib/types";
import { getImageUrl } from "@/lib/image";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

function PriceChange({ value }: { value: number }) {
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-semibold ${
        isPositive ? "text-price-green" : "text-price-red"
      }`}
    >
      <Icon className="w-3 h-3" />
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-muted text-xs text-center px-2">
        {alt}
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="absolute inset-0 skeleton" />}
      <img
        src={getImageUrl(src)}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-contain transition-all duration-300 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
      />
    </>
  );
}

function CardItem({ card, index }: { card: Card; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
    >
      <Link href={`/card/${card.id}`}>
        <div className="group rounded-xl bg-bg-card border border-border p-4 hover:border-accent/50 card-hover card-glow cursor-pointer">
          {/* Card image */}
          <div className="relative aspect-[2.5/3.5] rounded-lg bg-bg-secondary mb-3 overflow-hidden flex items-center justify-center">
            <CardImage src={card.image} alt={card.name} />
            {/* TCG badge */}
            <span
              className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                card.tcg === "pokemon"
                  ? "bg-pokemon/20 text-pokemon"
                  : "bg-onepiece/20 text-onepiece"
              }`}
            >
              {card.tcg === "pokemon" ? "PKM" : "OP"}
            </span>
          </div>

          {/* Card info */}
          <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
            {card.name}
          </h3>
          <p className="text-xs text-text-muted mt-0.5 truncate">
            {card.setName} &middot; {card.rarity}
          </p>

          {/* Price row */}
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-lg font-bold text-text-primary">
                ${card.currentPrice.toFixed(2)}
              </p>
              <PriceChange value={card.priceChange24h} />
            </div>
            {card.lastSold && (
              <div className="text-right">
                <p className="text-[10px] text-text-muted flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  Ultimo vendido
                </p>
                <p className="text-xs text-text-secondary font-medium">
                  ${card.lastSold.price.toFixed(2)}
                </p>
                <p className="text-[10px] text-text-muted">{card.lastSold.platform}</p>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CardGrid({ cards, title }: { cards: Card[]; title?: string }) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted">
        <p className="text-lg">No se encontraron cartas.</p>
        <p className="text-sm mt-1">Intenta con otro termino de busqueda.</p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h2 className="text-xl font-bold text-text-primary mb-5">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {cards.map((card, i) => (
          <CardItem key={card.id} card={card} index={i} />
        ))}
      </div>
    </div>
  );
}
