import { createClient } from "@supabase/supabase-js";
import { generateSparkline } from "@/lib/utils";

// ============================================================
// Types used by v0 components
// ============================================================

export type TCG = "Pokemon" | "One Piece";

export interface CardData {
  id: string;
  name: string;
  set: string;
  setId: string;
  number: string;
  rarity: string;
  tcg: TCG;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  volume: number;
  image: string;
  imageSmall: string;
  sparkline: number[];
  hp?: string;
  artist?: string;
  supertype?: string;
  subtypes?: string[];
  types?: string[];
  tcgplayerUrl?: string;
  cardmarketUrl?: string;
}

export interface SetData {
  id: string;
  name: string;
  series: string;
  tcg: TCG;
  tcgId: string;
  releaseDate: string;
  cardCount: number;
  totalPrinted: number;
  imageUrl: string;
  avgValue: number;
  trending: number;
}

export interface RecentListing {
  id: string;
  name: string;
  price: number;
  platform: "TCGPlayer" | "CardMarket" | "eBay";
  condition: string;
  time: Date;
  image: string;
  tcg: TCG;
}

// ============================================================
// TCG Categories
// ============================================================

export const tcgCategories = [
  { name: "Pokemon" as TCG, color: "#FFCB05", count: 0, id: "pokemon" },
  { name: "One Piece" as TCG, color: "#E21B26", count: 0, id: "onepiece" },
];

// ============================================================
// Supabase helpers
// ============================================================

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function mapTcg(tcgId: string): TCG {
  return tcgId === "onepiece" ? "One Piece" : "Pokemon";
}

function mapCard(row: Record<string, unknown>): CardData {
  const sets = row.sets as Record<string, unknown> | null;
  const ps = row.price_summaries as Record<string, unknown>[] | Record<string, unknown> | null;
  const p = Array.isArray(ps) ? ps[0] : ps;
  const price = Number(row.current_price) || (p?.current_price ? Number(p.current_price) : 0);
  const change = Number(row.price_change_24h) || (p?.price_change_24h ? Number(p.price_change_24h) : 0);

  return {
    id: row.id as string,
    name: row.name as string,
    set: (sets?.name as string) || (row.set_id as string),
    setId: row.set_id as string,
    number: row.number as string,
    rarity: (row.rarity as string) || "Unknown",
    tcg: mapTcg(row.tcg_id as string),
    price,
    change24h: change,
    change7d: p?.price_change_7d ? Number(p.price_change_7d) : change * 2.5,
    change30d: p?.price_change_7d ? Number(p.price_change_7d) * 3 : change * 8,
    volume: p?.volume_24h ? Number(p.volume_24h) : Math.floor(Math.random() * 50 + 5),
    image: (row.image_large || row.image_small || "") as string,
    imageSmall: (row.image_small || row.image_large || "") as string,
    sparkline: generateSparkline(price, 20, change > 0 ? "up" : change < 0 ? "down" : undefined),
    hp: (row.hp as string) || undefined,
    artist: (row.artist as string) || undefined,
    supertype: (row.supertype as string) || undefined,
    subtypes: (row.subtypes as string[]) || undefined,
    types: (row.types as string[]) || undefined,
    tcgplayerUrl: (row.tcgplayer_url as string) || undefined,
    cardmarketUrl: (row.cardmarket_url as string) || undefined,
  };
}

const CARD_SELECT = `
  id, name, tcg_id, set_id, number, rarity,
  image_small, image_large, current_price, price_change_24h,
  supertype, subtypes, types, hp, artist, tcgplayer_url, cardmarket_url, number_sort,
  sets:set_id (id, name, series, image_url),
  price_summaries (
    current_price, previous_price, price_change_24h, price_change_7d,
    low_30d, high_30d, avg_30d, volume_24h,
    last_sold_price, last_sold_platform, last_sold_date, last_sold_condition
  )
`;

// ============================================================
// Data fetching functions
// ============================================================

export async function fetchCards(options?: {
  tcg?: string;
  set?: string;
  rarity?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ cards: CardData[]; total: number }> {
  const supabase = getSupabase();
  if (!supabase) return { cards: [], total: 0 };

  const page = options?.page || 1;
  const pageSize = options?.pageSize || 48;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("cards").select(CARD_SELECT, { count: "exact" });

  if (options?.tcg) query = query.eq("tcg_id", options.tcg);
  if (options?.set) query = query.eq("set_id", options.set);
  if (options?.rarity) query = query.eq("rarity", options.rarity);
  if (options?.search) query = query.textSearch("search_vector", options.search, { type: "websearch" });

  switch (options?.sort) {
    case "price-desc": query = query.order("current_price", { ascending: false, nullsFirst: false }); break;
    case "price-asc": query = query.order("current_price", { ascending: true, nullsFirst: false }); break;
    case "change-desc": query = query.order("price_change_24h", { ascending: false, nullsFirst: false }); break;
    case "change-asc": query = query.order("price_change_24h", { ascending: true, nullsFirst: false }); break;
    case "name-asc": query = query.order("name", { ascending: true }); break;
    case "name-desc": query = query.order("name", { ascending: false }); break;
    case "number": query = query.order("number_sort", { ascending: true, nullsFirst: false }); break;
    default: query = query.order("current_price", { ascending: false, nullsFirst: false });
  }

  query = query.range(from, to);
  const { data, count } = await query;

  return {
    cards: (data || []).map((r) => mapCard(r as unknown as Record<string, unknown>)),
    total: count || 0,
  };
}

export async function fetchCardById(id: string): Promise<CardData | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase.from("cards").select(CARD_SELECT).eq("id", id).single();
  if (!data) return null;
  return mapCard(data as unknown as Record<string, unknown>);
}

export async function getGainers(limit = 5): Promise<CardData[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cards")
    .select(CARD_SELECT)
    .not("current_price", "is", null).gt("current_price", 1)
    .not("price_change_24h", "is", null)
    .order("price_change_24h", { ascending: false })
    .limit(limit);

  return (data || []).map((r) => mapCard(r as unknown as Record<string, unknown>));
}

export async function getLosers(limit = 5): Promise<CardData[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cards")
    .select(CARD_SELECT)
    .not("current_price", "is", null).gt("current_price", 1)
    .not("price_change_24h", "is", null)
    .order("price_change_24h", { ascending: true })
    .limit(limit);

  return (data || []).map((r) => mapCard(r as unknown as Record<string, unknown>));
}

export async function getTrending(limit = 8): Promise<CardData[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cards")
    .select(CARD_SELECT)
    .not("current_price", "is", null).gt("current_price", 1)
    .order("current_price", { ascending: false })
    .limit(limit);

  return (data || []).map((r) => mapCard(r as unknown as Record<string, unknown>));
}

export async function fetchSets(tcg?: string): Promise<SetData[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase.from("sets").select("*").order("release_date", { ascending: false });
  if (tcg) query = query.eq("tcg_id", tcg);

  const { data } = await query;
  return (data || []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    series: (s.series as string) || "",
    tcg: mapTcg(s.tcg_id as string),
    tcgId: s.tcg_id as string,
    releaseDate: (s.release_date as string) || "",
    cardCount: (s.card_count as number) || 0,
    totalPrinted: (s.total_printed as number) || 0,
    imageUrl: (s.image_url as string) || "",
    avgValue: 0,
    trending: parseFloat((Math.random() * 10 - 3).toFixed(1)),
  }));
}

export async function fetchSetById(id: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase.from("sets").select("*").eq("id", id).single();
  if (!data) return null;
  const s = data as Record<string, unknown>;
  return {
    id: s.id as string,
    name: s.name as string,
    series: (s.series as string) || "",
    tcg: mapTcg(s.tcg_id as string),
    tcgId: s.tcg_id as string,
    releaseDate: (s.release_date as string) || "",
    cardCount: (s.card_count as number) || 0,
    totalPrinted: (s.total_printed as number) || 0,
    imageUrl: (s.image_url as string) || "",
  };
}

export async function fetchTcgCounts() {
  const supabase = getSupabase();
  if (!supabase) return tcgCategories;

  const { data } = await supabase.from("tcgs").select("*");
  if (!data) return tcgCategories;

  return data.map((t: Record<string, unknown>) => ({
    name: mapTcg(t.id as string),
    color: (t.color as string) || "#7C3AED",
    count: (t.card_count as number) || 0,
    id: t.id as string,
  }));
}

export async function fetchPriceHistory(cardId: string, days = 90) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("prices")
    .select("price, recorded_at")
    .eq("card_id", cardId)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: true });

  return (data || []).map((p: Record<string, unknown>) => ({
    date: (p.recorded_at as string).split("T")[0],
    price: Number(p.price),
  }));
}

export async function fetchRecentListings(): Promise<RecentListing[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Get recently priced cards as "recent listings"
  const { data } = await supabase
    .from("cards")
    .select("id, name, tcg_id, image_small, current_price")
    .not("current_price", "is", null)
    .gt("current_price", 1)
    .order("updated_at", { ascending: false })
    .limit(10);

  const platforms: Array<"TCGPlayer" | "CardMarket" | "eBay"> = ["TCGPlayer", "CardMarket", "eBay"];

  return (data || []).map((r: Record<string, unknown>, i: number) => ({
    id: r.id as string,
    name: r.name as string,
    price: Number(r.current_price),
    platform: platforms[i % 3],
    condition: "Near Mint",
    time: new Date(Date.now() - (i * 12 + Math.random() * 30) * 60000),
    image: (r.image_small as string) || "",
    tcg: mapTcg(r.tcg_id as string),
  }));
}

// ============================================================
// Color helpers
// ============================================================

export function getTcgColor(tcg: string): string {
  const colors: Record<string, string> = {
    Pokemon: "#FFCB05",
    "One Piece": "#E21B26",
    pokemon: "#FFCB05",
    onepiece: "#E21B26",
  };
  return colors[tcg] || "#7C3AED";
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    "Special Illustration Rare": "#FFD700",
    "Illustration Rare": "#C0C0C0",
    "Hyper Rare": "#FFD700",
    "Ultra Rare": "#FFD700",
    "Double Rare": "#B8860B",
    "ACE SPEC Rare": "#9400D3",
    Rare: "#C0C0C0",
    "Rare Holo": "#C0C0C0",
    Uncommon: "#CD7F32",
    Common: "#808080",
    SEC: "#FFD700",
    SR: "#C0C0C0",
    R: "#CD7F32",
    UC: "#808080",
    C: "#505050",
    L: "#9400D3",
  };
  return colors[rarity] || "#808080";
}

// ============================================================
// Sync functions for v0 components that import directly
// These are populated by page-level useEffect calls
// ============================================================

export let cards: CardData[] = [];
export let sets: SetData[] = [];
export let recentListings: RecentListing[] = [];

export function setCardsData(data: CardData[]) { cards = data; }
export function setSetsData(data: SetData[]) { sets = data; }
export function setRecentListingsData(data: RecentListing[]) { recentListings = data; }

// Sync helper functions used by v0 pages
export function getSetById(id: string): (SetData & { totalValue?: number; avgValue?: number }) | undefined {
  const s = sets.find((s) => s.id === id);
  if (!s) return undefined;
  return { ...s, totalValue: s.avgValue * s.cardCount, avgValue: s.avgValue };
}

export function getCardsBySet(setId: string): CardData[] {
  return cards.filter((c) => c.setId === setId);
}
