export type TCGId = "pokemon" | "onepiece";

export interface TCG {
  id: TCGId;
  name: string;
  logo: string;
  color: string;
  cardCount: number;
}

export interface CardSet {
  id: string;
  name: string;
  tcg: TCGId;
  releaseDate: string;
  cardCount: number;
  image?: string;
}

export interface Card {
  id: string;
  name: string;
  tcg: TCGId;
  set: string;
  setName: string;
  number: string;
  rarity: string;
  image: string;
  currentPrice: number | null;
  previousPrice: number | null;
  priceChange24h: number | null;
  lastSold?: LastSold;
}

export interface LastSold {
  price: number;
  platform: string;
  date: string;
  condition: string;
}

export interface PricePoint {
  date: string;
  price: number;
  volume?: number;
}

export interface PriceHistory {
  cardId: string;
  prices: PricePoint[];
}

export interface PlatformPrice {
  platform: string;
  price: number;
  url: string;
  condition: string;
  lastUpdated: string;
}
