import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// POST /api/seed/prices?tcg=onepiece
// Generates estimated market prices for cards without price data based on rarity
const RARITY_PRICES: Record<string, { min: number; max: number }> = {
  // One Piece rarities
  SEC: { min: 80, max: 350 },
  SR: { min: 15, max: 80 },
  R: { min: 2, max: 15 },
  UC: { min: 0.5, max: 3 },
  C: { min: 0.1, max: 1 },
  L: { min: 5, max: 40 },
  // Pokemon rarities (for cards missing prices)
  "Special Illustration Rare": { min: 30, max: 200 },
  "Illustration Rare": { min: 5, max: 40 },
  "Ultra Rare": { min: 8, max: 50 },
  "Double Rare": { min: 2, max: 15 },
  "Hyper Rare": { min: 15, max: 100 },
  "ACE SPEC Rare": { min: 5, max: 25 },
  Rare: { min: 0.5, max: 5 },
  Uncommon: { min: 0.1, max: 1 },
  Common: { min: 0.05, max: 0.5 },
};

function estimatePrice(rarity: string): number {
  const range = RARITY_PRICES[rarity] || { min: 0.1, max: 2 };
  const price = range.min + Math.random() * (range.max - range.min);
  return parseFloat(price.toFixed(2));
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tcg = req.nextUrl.searchParams.get("tcg") || "onepiece";

  try {
    const supabase = createSupabaseAdmin();

    // Get all cards without a price summary for this TCG
    const { data: cards } = await supabase
      .from("cards")
      .select("id, rarity")
      .eq("tcg_id", tcg);

    if (!cards?.length) {
      return NextResponse.json({ error: "No cards found" }, { status: 404 });
    }

    // Check which cards already have price summaries
    const { data: existing } = await supabase
      .from("price_summaries")
      .select("card_id")
      .in("card_id", cards.map((c) => c.id))
      .gt("current_price", 0);

    const existingIds = new Set((existing || []).map((e) => e.card_id));
    const cardsWithoutPrice = cards.filter((c) => !existingIds.has(c.id));

    if (cardsWithoutPrice.length === 0) {
      return NextResponse.json({ message: "All cards already have prices", count: 0 });
    }

    // Generate prices and insert
    const prices = cardsWithoutPrice.map((c) => {
      const price = estimatePrice(c.rarity || "Common");
      return {
        card_id: c.id,
        source: "estimated",
        price,
        condition: "Near Mint",
      };
    });

    // Insert prices in batches
    for (let i = 0; i < prices.length; i += 200) {
      await supabase.from("prices").insert(prices.slice(i, i + 200));
    }

    // Create/update price summaries with small random changes
    const summaries = cardsWithoutPrice.map((c) => {
      const price = estimatePrice(c.rarity || "Common");
      const change = parseFloat((Math.random() * 16 - 6).toFixed(2)); // -6% to +10%
      const prevPrice = parseFloat((price / (1 + change / 100)).toFixed(2));

      return {
        card_id: c.id,
        current_price: price,
        previous_price: prevPrice,
        price_change_24h: change,
        price_change_7d: parseFloat((Math.random() * 30 - 10).toFixed(2)),
        low_30d: parseFloat((price * 0.8).toFixed(2)),
        high_30d: parseFloat((price * 1.2).toFixed(2)),
        avg_30d: price,
      };
    });

    for (let i = 0; i < summaries.length; i += 200) {
      await supabase
        .from("price_summaries")
        .upsert(summaries.slice(i, i + 200), { onConflict: "card_id" });
    }

    return NextResponse.json({
      success: true,
      count: cardsWithoutPrice.length,
      message: `Generated estimated prices for ${cardsWithoutPrice.length} ${tcg} cards`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
