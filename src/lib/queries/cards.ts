import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export interface CardWithPrice {
  id: string;
  name: string;
  tcg_id: string;
  set_id: string;
  number: string;
  rarity: string | null;
  image_small: string | null;
  image_large: string | null;
  supertype: string | null;
  subtypes: string[] | null;
  types: string[] | null;
  artist: string | null;
  hp: string | null;
  tcgplayer_url: string | null;
  cardmarket_url: string | null;
  set: {
    id: string;
    name: string;
    series: string | null;
    image_url: string | null;
  } | null;
  price_summary: {
    current_price: number | null;
    previous_price: number | null;
    price_change_24h: number | null;
    price_change_7d: number | null;
    low_30d: number | null;
    high_30d: number | null;
    last_sold_price: number | null;
    last_sold_platform: string | null;
    last_sold_date: string | null;
    last_sold_condition: string | null;
  } | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const CARD_SELECT = `
  id, name, tcg_id, set_id, number, rarity, image_small, image_large,
  supertype, subtypes, types, artist, hp, tcgplayer_url, cardmarket_url,
  sets:set_id (id, name, series, image_url),
  price_summaries:price_summaries (
    current_price, previous_price, price_change_24h, price_change_7d,
    low_30d, high_30d, last_sold_price, last_sold_platform,
    last_sold_date, last_sold_condition
  )
`;

function mapCardRow(row: Record<string, unknown>): CardWithPrice {
  const sets = row.sets as Record<string, unknown> | null;
  const prices = row.price_summaries as Record<string, unknown>[] | Record<string, unknown> | null;
  const priceData = Array.isArray(prices) ? prices[0] : prices;

  return {
    id: row.id as string,
    name: row.name as string,
    tcg_id: row.tcg_id as string,
    set_id: row.set_id as string,
    number: row.number as string,
    rarity: row.rarity as string | null,
    image_small: row.image_small as string | null,
    image_large: row.image_large as string | null,
    supertype: row.supertype as string | null,
    subtypes: row.subtypes as string[] | null,
    types: row.types as string[] | null,
    artist: row.artist as string | null,
    hp: row.hp as string | null,
    tcgplayer_url: row.tcgplayer_url as string | null,
    cardmarket_url: row.cardmarket_url as string | null,
    set: sets
      ? {
          id: sets.id as string,
          name: sets.name as string,
          series: sets.series as string | null,
          image_url: sets.image_url as string | null,
        }
      : null,
    price_summary: priceData
      ? {
          current_price: priceData.current_price as number | null,
          previous_price: priceData.previous_price as number | null,
          price_change_24h: priceData.price_change_24h as number | null,
          price_change_7d: priceData.price_change_7d as number | null,
          low_30d: priceData.low_30d as number | null,
          high_30d: priceData.high_30d as number | null,
          last_sold_price: priceData.last_sold_price as number | null,
          last_sold_platform: priceData.last_sold_platform as string | null,
          last_sold_date: priceData.last_sold_date as string | null,
          last_sold_condition: priceData.last_sold_condition as string | null,
        }
      : null,
  };
}

type SortOption =
  | "price-desc"
  | "price-asc"
  | "change-desc"
  | "change-asc"
  | "name-asc"
  | "name-desc"
  | "";

export async function getCards(options: {
  tcg?: string;
  setId?: string;
  rarity?: string;
  search?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<CardWithPrice>> {
  const supabase = getClient();
  const page = options.page || 1;
  const pageSize = options.pageSize || 48;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("cards").select(CARD_SELECT, { count: "exact" });

  if (options.tcg) {
    query = query.eq("tcg_id", options.tcg);
  }
  if (options.setId) {
    query = query.eq("set_id", options.setId);
  }
  if (options.rarity) {
    query = query.eq("rarity", options.rarity);
  }
  if (options.search) {
    query = query.textSearch("search_vector", options.search, {
      type: "websearch",
    });
  }

  // Sorting
  switch (options.sort) {
    case "name-asc":
      query = query.order("name", { ascending: true });
      break;
    case "name-desc":
      query = query.order("name", { ascending: false });
      break;
    default:
      query = query.order("name", { ascending: true });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("getCards error:", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count || 0;

  return {
    data: (data || []).map((row) => mapCardRow(row as unknown as Record<string, unknown>)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCardById(id: string): Promise<CardWithPrice | null> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("cards")
    .select(CARD_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return mapCardRow(data as unknown as Record<string, unknown>);
}

export async function getTrendingCards(limit = 12): Promise<CardWithPrice[]> {
  const supabase = getClient();

  // Get cards with highest absolute price change
  const { data: summaries } = await supabase
    .from("price_summaries")
    .select("card_id")
    .not("price_change_24h", "is", null)
    .order("price_change_24h", { ascending: false })
    .limit(limit);

  if (!summaries?.length) return [];

  const ids = summaries.map((s) => s.card_id);

  const { data } = await supabase
    .from("cards")
    .select(CARD_SELECT)
    .in("id", ids);

  return (data || []).map((row) => mapCardRow(row as unknown as Record<string, unknown>));
}

export async function getTopMovers(
  direction: "up" | "down",
  limit = 5
): Promise<CardWithPrice[]> {
  const supabase = getClient();

  const { data: summaries } = await supabase
    .from("price_summaries")
    .select("card_id")
    .not("price_change_24h", "is", null)
    .not("current_price", "is", null)
    .order("price_change_24h", { ascending: direction === "down" })
    .limit(limit);

  if (!summaries?.length) return [];

  const ids = summaries.map((s) => s.card_id);

  const { data } = await supabase
    .from("cards")
    .select(CARD_SELECT)
    .in("id", ids);

  return (data || []).map((row) => mapCardRow(row as unknown as Record<string, unknown>));
}

export async function getRarities(tcg?: string): Promise<string[]> {
  const supabase = getClient();

  let query = supabase.from("cards").select("rarity").not("rarity", "is", null);

  if (tcg) {
    query = query.eq("tcg_id", tcg);
  }

  const { data } = await query;

  const unique = [...new Set((data || []).map((r) => r.rarity as string))];
  return unique.sort();
}

export async function getSets(tcg?: string) {
  const supabase = getClient();

  let query = supabase
    .from("sets")
    .select("*")
    .order("release_date", { ascending: false });

  if (tcg) {
    query = query.eq("tcg_id", tcg);
  }

  const { data } = await query;
  return data || [];
}

export async function getPriceHistory(cardId: string, days = 90) {
  const supabase = getClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("prices")
    .select("price, recorded_at, source")
    .eq("card_id", cardId)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: true });

  return (data || []).map((p) => ({
    date: p.recorded_at.split("T")[0],
    price: Number(p.price),
    source: p.source,
  }));
}

export async function getPlatformListings(cardId: string) {
  const supabase = getClient();

  const { data } = await supabase
    .from("platform_listings")
    .select("*")
    .eq("card_id", cardId)
    .order("price", { ascending: true });

  return data || [];
}
