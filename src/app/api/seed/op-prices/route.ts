import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// GET/POST /api/seed/op-prices
// Fetches REAL market prices from optcgapi.com for all One Piece cards
// Also discovers new cards/sets not yet in our DB

interface OptcgCard {
  inventory_price: number | null;
  market_price: number | null;
  card_name: string;
  set_name: string;
  set_id?: string;
  rarity: string;
  card_set_id: string;
  card_color: string;
  card_type: string;
  life: string | null;
  card_cost: string;
  card_power: string;
  sub_types: string;
  counter_amount: number;
  attribute: string;
  date_scraped: string;
  card_image_id: string;
  card_image: string;
  card_text?: string;
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  const key = req.nextUrl.searchParams.get("key");
  if (key === secret) return true;
  return false;
}

async function fetchOptcgCards(endpoint: string): Promise<OptcgCard[]> {
  const res = await fetch(`https://www.optcgapi.com/api/${endpoint}`, {
    headers: { "User-Agent": "TCGSignals/1.0" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function deriveSetId(card: OptcgCard): string {
  // card_set_id is like "OP09-118", extract "OP-09"
  const match = card.card_set_id.match(/^([A-Z]+)(\d{2})-/);
  if (match) return `${match[1]}-${match[2]}`;
  // fallback to set_id if present
  return card.set_id || "unknown";
}

function buildCardId(card: OptcgCard): string {
  // Our DB uses "op-{card_image_id}" format (lowercase)
  return `op-${card.card_image_id.toLowerCase()}`;
}

async function runSync(log: string[]) {
  const supabase = createSupabaseAdmin();

  // 1. Fetch ALL cards from optcgapi.com
  log.push("Fetching set cards from optcgapi.com...");
  const setCards = await fetchOptcgCards("allSetCards/");
  log.push(`  Got ${setCards.length} set cards`);

  log.push("Fetching starter deck cards...");
  const stCards = await fetchOptcgCards("allSTCards/");
  log.push(`  Got ${stCards.length} starter deck cards`);

  log.push("Fetching promo cards...");
  const promoCards = await fetchOptcgCards("allPromoCards/");
  log.push(`  Got ${promoCards.length} promo cards`);

  const allCards = [...setCards, ...stCards, ...promoCards];
  log.push(`Total: ${allCards.length} cards from optcgapi.com`);

  // 2. Discover sets
  const setsMap = new Map<string, { name: string; id: string }>();
  for (const card of allCards) {
    const setId = deriveSetId(card);
    if (setId !== "unknown" && !setsMap.has(setId)) {
      setsMap.set(setId, { name: card.set_name, id: setId });
    }
  }

  // Upsert sets
  const setRows = [...setsMap.values()].map((s) => ({
    id: s.id,
    tcg_id: "onepiece" as const,
    name: s.name,
    slug: s.id.toLowerCase(),
    code: s.id,
    release_date: null,
    card_count: 0,
    image_url: null,
    series: "One Piece",
  }));

  if (setRows.length > 0) {
    await supabase.from("sets").upsert(setRows, { onConflict: "id" });
    log.push(`Upserted ${setRows.length} sets`);
  }

  // 3. Upsert cards and prices
  let cardsUpserted = 0;
  let pricesUpserted = 0;
  let skipped = 0;

  // Process in batches
  const cardBatch: Array<Record<string, unknown>> = [];
  const priceBatch: Array<Record<string, unknown>> = [];
  const summaryBatch: Array<Record<string, unknown>> = [];

  for (const card of allCards) {
    if (!card.card_image_id || !card.card_name) { skipped++; continue; }

    const cardId = buildCardId(card);
    const setId = deriveSetId(card);
    const marketPrice = card.market_price || 0;

    cardBatch.push({
      id: cardId,
      tcg_id: "onepiece",
      set_id: setId,
      name: card.card_name,
      number: card.card_set_id,
      rarity: card.rarity || "Unknown",
      supertype: card.card_type || "Character",
      subtypes: card.card_color ? [card.card_color] : [],
      types: card.card_color ? [card.card_color] : [],
      image_small: card.card_image,
      image_large: card.card_image,
      hp: card.card_power || null,
      artist: null,
      flavor_text: card.card_text || null,
      tcg_external_id: card.card_image_id,
      tcgplayer_url: null,
      cardmarket_url: null,
      current_price: marketPrice > 0 ? marketPrice : null,
      price_change_24h: null,
    });

    if (marketPrice > 0) {
      priceBatch.push({
        card_id: cardId,
        source: "tcgplayer",
        price: marketPrice,
        condition: "Near Mint",
      });

      summaryBatch.push({
        card_id: cardId,
        current_price: marketPrice,
        previous_price: marketPrice,
        price_change_24h: 0,
      });
    }

    // Flush in batches of 200
    if (cardBatch.length >= 200) {
      await supabase.from("cards").upsert(cardBatch, { onConflict: "id" });
      cardsUpserted += cardBatch.length;
      cardBatch.length = 0;

      if (priceBatch.length > 0) {
        await supabase.from("prices").insert(priceBatch);
        pricesUpserted += priceBatch.length;
        priceBatch.length = 0;
      }

      if (summaryBatch.length > 0) {
        await supabase.from("price_summaries").upsert(summaryBatch, { onConflict: "card_id" });
        summaryBatch.length = 0;
      }
    }
  }

  // Flush remaining
  if (cardBatch.length > 0) {
    await supabase.from("cards").upsert(cardBatch, { onConflict: "id" });
    cardsUpserted += cardBatch.length;
  }
  if (priceBatch.length > 0) {
    await supabase.from("prices").insert(priceBatch);
    pricesUpserted += priceBatch.length;
  }
  if (summaryBatch.length > 0) {
    await supabase.from("price_summaries").upsert(summaryBatch, { onConflict: "card_id" });
  }

  // 4. Update set card counts
  for (const [setId] of setsMap) {
    const { count } = await supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("set_id", setId);

    await supabase.from("sets").update({ card_count: count || 0 }).eq("id", setId);
  }

  // 5. Update total OP card count
  const { count: totalOp } = await supabase
    .from("cards")
    .select("*", { count: "exact", head: true })
    .eq("tcg_id", "onepiece");

  await supabase.from("tcgs").update({ card_count: totalOp || 0 }).eq("id", "onepiece");

  log.push(`Cards upserted: ${cardsUpserted}`);
  log.push(`Prices inserted: ${pricesUpserted}`);
  log.push(`Skipped: ${skipped}`);
  log.push(`Total OP cards in DB: ${totalOp}`);

  return {
    success: true,
    stats: {
      sets: setRows.length,
      cards: cardsUpserted,
      prices: pricesUpserted,
      skipped,
      totalInDb: totalOp,
    },
    log,
  };
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Add ?key=YOUR_SERVICE_ROLE_KEY" }, { status: 401 });
  }
  try {
    const log: string[] = [];
    const result = await runSync(log);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const log: string[] = [];
    const result = await runSync(log);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
