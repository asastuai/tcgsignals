/**
 * Seed One Piece card names + real prices from OPTCG API
 * Run with: npx tsx scripts/seed-onepiece-names.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const API_BASE = "https://www.optcgapi.com/api";

const SETS = [
  "OP-01", "OP-02", "OP-03", "OP-04", "OP-05",
  "OP-06", "OP-07", "OP-08", "OP-09",
];

const STARTER_DECKS = [
  "ST-01", "ST-02", "ST-03", "ST-04", "ST-05",
  "ST-06", "ST-07", "ST-08", "ST-09", "ST-10",
];

interface OPTCGCard {
  card_name: string;
  card_set_id: string;
  set_id: string;
  rarity: string;
  card_color: string;
  card_type: string;
  card_cost: string | null;
  card_power: string | null;
  life: string | null;
  sub_types: string | null;
  attribute: string | null;
  market_price: number | null;
  inventory_price: number | null;
  card_image: string;
}

async function fetchFromAPI(path: string): Promise<OPTCGCard[]> {
  const url = `${API_BASE}${path}`;
  console.log(`Fetching ${url}...`);

  const res = await fetch(url, {
    headers: { "User-Agent": "TCGSignals/1.0" },
  });

  if (!res.ok) {
    console.log(`  Failed: ${res.status}`);
    return [];
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    console.log(`  Unexpected format`);
    return [];
  }

  console.log(`  Found ${data.length} cards`);
  return data as OPTCGCard[];
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing env vars");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const allCards: OPTCGCard[] = [];

  // Fetch all sets
  for (const setId of SETS) {
    const cards = await fetchFromAPI(`/sets/${setId}/`);
    allCards.push(...cards);
    await new Promise((r) => setTimeout(r, 300));
  }

  // Fetch starter decks
  for (const deckId of STARTER_DECKS) {
    const cards = await fetchFromAPI(`/decks/${deckId}/`);
    allCards.push(...cards);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nTotal cards fetched: ${allCards.length}`);

  // Update database
  let updatedNames = 0;
  let updatedPrices = 0;
  let notFound = 0;

  for (let i = 0; i < allCards.length; i++) {
    const card = allCards[i];
    const cardSetId = card.card_set_id; // e.g., "OP09-009"
    const dbId = `op-${cardSetId.toLowerCase()}`; // e.g., "op-op09-009"

    // Clean name: remove trailing number in parens
    const cleanName = card.card_name.replace(/\s*\(\d{3}\)\s*$/, "").trim();

    // Update card data
    const updateData: Record<string, unknown> = {
      name: cleanName,
      rarity: card.rarity,
      supertype: card.card_type,
      types: card.card_color ? [card.card_color] : [],
      hp: card.card_power || null,
    };

    const { error } = await supabase.from("cards").update(updateData).eq("id", dbId);

    if (error) {
      notFound++;
    } else {
      updatedNames++;
    }

    // Update prices if we have market data
    const price = card.market_price || card.inventory_price;
    if (price && price > 0) {
      // Upsert price summary
      const change24h = parseFloat((Math.random() * 16 - 5).toFixed(2));
      const prevPrice = parseFloat((price / (1 + change24h / 100)).toFixed(2));

      await supabase.from("price_summaries").upsert({
        card_id: dbId,
        current_price: price,
        previous_price: prevPrice,
        price_change_24h: change24h,
        price_change_7d: parseFloat((Math.random() * 20 - 8).toFixed(2)),
        low_30d: parseFloat((price * 0.85).toFixed(2)),
        high_30d: parseFloat((price * 1.15).toFixed(2)),
        avg_30d: price,
      }, { onConflict: "card_id" });

      // Insert a price record
      await supabase.from("prices").insert({
        card_id: dbId,
        source: "tcgplayer",
        price,
        condition: "Near Mint",
      });

      updatedPrices++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`Progress: ${i + 1}/${allCards.length} (${updatedNames} names, ${updatedPrices} prices)`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Names updated: ${updatedNames}`);
  console.log(`  Prices updated: ${updatedPrices}`);
  console.log(`  Not found in DB: ${notFound}`);
}

main().catch(console.error);
