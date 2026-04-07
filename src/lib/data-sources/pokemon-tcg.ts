/**
 * Pokemon TCG API client
 * Docs: https://docs.pokemontcg.io
 *
 * Rate limits:
 *   - Without API key: 1,000 requests/day, 30 req/min
 *   - With API key: 20,000 requests/day
 *
 * Each card variant (regular, holo, full art, SAR, etc.) is its own entry
 * with a unique ID like "sv8-234" and its own image.
 */

const BASE_URL = "https://api.pokemontcg.io/v2";

interface PokemonTCGSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

interface PokemonTCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  set: {
    id: string;
    name: string;
  };
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices?: Record<string, {
      low?: number;
      mid?: number;
      high?: number;
      market?: number;
      directLow?: number;
    }>;
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices?: {
      averageSellPrice?: number;
      lowPrice?: number;
      trendPrice?: number;
    };
  };
}

interface APIResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = process.env.POKEMON_TCG_API_KEY;
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }
  return headers;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: getHeaders() });

    if (res.status === 429) {
      // Rate limited — wait and retry
      const wait = Math.pow(2, i) * 2000;
      console.log(`Rate limited, waiting ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }

    return res;
  }
  throw new Error("Max retries exceeded");
}

export async function fetchAllSets(): Promise<PokemonTCGSet[]> {
  const allSets: PokemonTCGSet[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const res = await fetchWithRetry(
      `${BASE_URL}/sets?orderBy=-releaseDate&page=${page}&pageSize=${pageSize}`
    );
    const data: APIResponse<PokemonTCGSet> = await res.json();
    allSets.push(...data.data);

    if (allSets.length >= data.totalCount) break;
    page++;
  }

  console.log(`Fetched ${allSets.length} Pokemon sets`);
  return allSets;
}

export async function fetchCardsBySet(setId: string): Promise<PokemonTCGCard[]> {
  const allCards: PokemonTCGCard[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const res = await fetchWithRetry(
      `${BASE_URL}/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}`
    );
    const data: APIResponse<PokemonTCGCard> = await res.json();
    allCards.push(...data.data);

    if (allCards.length >= data.totalCount) break;
    page++;
  }

  return allCards;
}

export async function fetchAllCards(
  onProgress?: (setName: string, cardCount: number, totalSets: number, currentSet: number) => void
): Promise<{ sets: PokemonTCGSet[]; cards: PokemonTCGCard[] }> {
  const sets = await fetchAllSets();
  const allCards: PokemonTCGCard[] = [];

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    const cards = await fetchCardsBySet(set.id);
    allCards.push(...cards);
    onProgress?.(set.name, cards.length, sets.length, i + 1);

    // Small delay between sets to respect rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`Fetched ${allCards.length} Pokemon cards total`);
  return { sets, cards: allCards };
}

// Map API data to our DB schema
export function mapSetToDB(set: PokemonTCGSet) {
  return {
    id: set.id,
    tcg_id: "pokemon" as const,
    name: set.name,
    slug: set.id,
    code: set.id,
    release_date: set.releaseDate,
    card_count: set.total,
    total_printed: set.printedTotal,
    image_url: set.images.logo,
    series: set.series,
  };
}

export function mapCardToDB(card: PokemonTCGCard) {
  return {
    id: card.id,
    tcg_id: "pokemon" as const,
    set_id: card.set.id,
    name: card.name,
    number: card.number,
    rarity: card.rarity || "Unknown",
    supertype: card.supertype,
    subtypes: card.subtypes || [],
    types: card.types || [],
    image_small: card.images.small,
    image_large: card.images.large,
    artist: card.artist || null,
    flavor_text: card.flavorText || null,
    hp: card.hp || null,
    tcg_external_id: card.id,
    tcgplayer_url: card.tcgplayer?.url || null,
    cardmarket_url: card.cardmarket?.url || null,
  };
}

// Extract price data from card API response (TCGPlayer includes market prices)
export function extractPrices(card: PokemonTCGCard) {
  const prices: Array<{
    card_id: string;
    source: string;
    price: number;
    condition: string;
  }> = [];

  // TCGPlayer prices
  if (card.tcgplayer?.prices) {
    for (const [variant, priceData] of Object.entries(card.tcgplayer.prices)) {
      if (priceData.market) {
        prices.push({
          card_id: card.id,
          source: "tcgplayer",
          price: priceData.market,
          condition: variant, // 'normal', 'holofoil', 'reverseHolofoil', etc.
        });
      }
    }
  }

  // CardMarket prices
  if (card.cardmarket?.prices?.trendPrice) {
    prices.push({
      card_id: card.id,
      source: "cardmarket",
      price: card.cardmarket.prices.trendPrice,
      condition: "Near Mint",
    });
  }

  return prices;
}
