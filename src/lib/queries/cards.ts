import { createClient } from "@supabase/supabase-js";
import type { Card, PricePoint, PlatformPrice } from "@/lib/types";

// Singleton-ish client (recreated per page load, fine for client components)
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

// ============================================================
// CARD SELECT — single source of truth for all card queries
// ============================================================

const CARD_SELECT = `
  id, name, tcg_id, set_id, number, rarity, image_small, image_large,
  current_price, price_change_24h, number_sort,
  supertype, subtypes, types, artist, hp, tcgplayer_url, cardmarket_url,
  sets:set_id (id, name, series, image_url),
  price_summaries (
    current_price, previous_price, price_change_24h, price_change_7d,
    low_30d, high_30d, last_sold_price, last_sold_platform,
    last_sold_date, last_sold_condition
  )
`;

// ============================================================
// toCard — SINGLE mapping function used by ALL pages
// ============================================================

export function toCard(row: Record<string, unknown>): Card {
  const sets = row.sets as Record<string, unknown> | null;
  const prices = row.price_summaries as Record<string, unknown>[] | Record<string, unknown> | null;
  const p = Array.isArray(prices) ? prices[0] : prices;

  return {
    id: row.id as string,
    name: row.name as string,
    tcg: (row.tcg_id as string) === "onepiece" ? "onepiece" : "pokemon",
    set: row.set_id as string,
    setName: (sets?.name as string) || (row.set_id as string),
    number: row.number as string,
    rarity: (row.rarity as string) || "Unknown",
    image: (row.image_large || row.image_small || "") as string,
    currentPrice: p?.current_price != null ? Number(p.current_price) : null,
    previousPrice: p?.previous_price != null ? Number(p.previous_price) : null,
    priceChange24h: p?.price_change_24h != null ? Number(p.price_change_24h) : null,
    lastSold: p?.last_sold_price != null
      ? {
          price: Number(p.last_sold_price),
          platform: (p.last_sold_platform as string) || "",
          date: (p.last_sold_date as string) || "",
          condition: (p.last_sold_condition as string) || "Near Mint",
        }
      : undefined,
  };
}

// Extra card data for detail page
export interface CardExtra {
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
}

export function toCardExtra(row: Record<string, unknown>): CardExtra {
  const prices = row.price_summaries as Record<string, unknown>[] | Record<string, unknown> | null;
  const p = Array.isArray(prices) ? prices[0] : prices;

  return {
    artist: (row.artist as string) || undefined,
    hp: (row.hp as string) || undefined,
    supertype: (row.supertype as string) || undefined,
    subtypes: (row.subtypes as string[]) || undefined,
    types: (row.types as string[]) || undefined,
    tcgplayerUrl: (row.tcgplayer_url as string) || undefined,
    cardmarketUrl: (row.cardmarket_url as string) || undefined,
    low30d: p?.low_30d != null ? Number(p.low_30d) : undefined,
    high30d: p?.high_30d != null ? Number(p.high_30d) : undefined,
    priceChange7d: p?.price_change_7d != null ? Number(p.price_change_7d) : undefined,
  };
}

// ============================================================
// QUERIES
// ============================================================

export type SortOption =
  | "price-desc" | "price-asc"
  | "change-desc" | "change-asc"
  | "name-asc" | "name-desc"
  | "number-asc"
  | "";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getCards(options: {
  tcg?: string;
  setId?: string;
  rarity?: string;
  search?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<Record<string, unknown>>> {
  try {
    const supabase = getSupabase();
    const page = options.page || 1;
    const pageSize = options.pageSize || 48;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("cards").select(CARD_SELECT, { count: "exact" });

    if (options.tcg) query = query.eq("tcg_id", options.tcg);
    if (options.setId) query = query.eq("set_id", options.setId);
    if (options.rarity) query = query.eq("rarity", options.rarity);
    if (options.search) {
      query = query.textSearch("search_vector", options.search, { type: "websearch" });
    }

    // Server-side sorting using denormalized columns
    switch (options.sort) {
      case "price-desc":
        query = query.order("current_price", { ascending: false, nullsFirst: false });
        break;
      case "price-asc":
        query = query.order("current_price", { ascending: true, nullsFirst: false });
        break;
      case "change-desc":
        query = query.order("price_change_24h", { ascending: false, nullsFirst: false });
        break;
      case "change-asc":
        query = query.order("price_change_24h", { ascending: true, nullsFirst: false });
        break;
      case "name-asc":
        query = query.order("name", { ascending: true });
        break;
      case "name-desc":
        query = query.order("name", { ascending: false });
        break;
      case "number-asc":
        query = query.order("number_sort", { ascending: true, nullsFirst: false });
        break;
      default:
        // Default: priced cards first, then by name
        query = query.order("current_price", { ascending: false, nullsFirst: false });
        break;
    }

    query = query.range(from, to);
    const { data, count, error } = await query;

    if (error) {
      console.error("getCards error:", error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as unknown as Record<string, unknown>[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (e) {
    console.error("getCards failed:", e);
    return { data: [], total: 0, page: 1, pageSize: 48, totalPages: 0 };
  }
}

export async function getCardById(id: string): Promise<Record<string, unknown> | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("cards")
      .select(CARD_SELECT)
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as unknown as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getTrendingCards(limit = 12): Promise<Record<string, unknown>[]> {
  try {
    const supabase = getSupabase();

    // Get cards with highest absolute price change, ordered by price
    const { data } = await supabase
      .from("cards")
      .select(CARD_SELECT)
      .not("current_price", "is", null)
      .gt("current_price", 1)
      .order("current_price", { ascending: false })
      .limit(limit);

    return (data || []) as unknown as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export async function getTopMovers(
  direction: "up" | "down",
  limit = 5
): Promise<Record<string, unknown>[]> {
  try {
    const supabase = getSupabase();

    const { data } = await supabase
      .from("cards")
      .select(CARD_SELECT)
      .not("current_price", "is", null)
      .gt("current_price", 1)
      .not("price_change_24h", "is", null)
      .order("price_change_24h", { ascending: direction === "down" })
      .limit(limit);

    return (data || []) as unknown as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export async function getRarities(tcg?: string): Promise<string[]> {
  try {
    const supabase = getSupabase();

    let query = supabase.from("cards").select("rarity").not("rarity", "is", null);
    if (tcg) query = query.eq("tcg_id", tcg);

    const { data } = await query;
    return [...new Set((data || []).map((r) => r.rarity as string))].sort();
  } catch {
    return [];
  }
}

export async function getSets(tcg?: string) {
  try {
    const supabase = getSupabase();
    let query = supabase.from("sets").select("*").order("release_date", { ascending: false });
    if (tcg) query = query.eq("tcg_id", tcg);
    const { data } = await query;
    return data || [];
  } catch {
    return [];
  }
}

export async function getSetById(id: string) {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("sets").select("*").eq("id", id).single();
    return data;
  } catch {
    return null;
  }
}

export async function getTcgs() {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("tcgs").select("*");
    return (data || []).map((t) => ({
      id: t.id as string,
      name: t.name as string,
      color: (t.color as string) || "#6c5ce7",
      cardCount: (t.card_count as number) || 0,
    }));
  } catch {
    return [];
  }
}

export async function getPriceHistory(cardId: string, days = 90): Promise<PricePoint[]> {
  try {
    const supabase = getSupabase();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await supabase
      .from("prices")
      .select("price, recorded_at")
      .eq("card_id", cardId)
      .gte("recorded_at", since.toISOString())
      .order("recorded_at", { ascending: true });

    return (data || []).map((p) => ({
      date: (p.recorded_at as string).split("T")[0],
      price: Number(p.price),
    }));
  } catch {
    return [];
  }
}

export async function getPlatformListings(cardId: string): Promise<PlatformPrice[]> {
  try {
    const supabase = getSupabase();

    const { data } = await supabase
      .from("platform_listings")
      .select("*")
      .eq("card_id", cardId)
      .order("price", { ascending: true });

    return (data || []).map((l) => ({
      platform: l.platform as string,
      price: Number(l.price),
      url: (l.url as string) || "#",
      condition: (l.condition as string) || "Near Mint",
      lastUpdated: l.last_checked as string,
    }));
  } catch {
    return [];
  }
}
