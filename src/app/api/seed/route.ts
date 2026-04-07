import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  fetchAllSets,
  fetchCardsBySet,
  mapSetToDB,
  mapCardToDB,
  extractPrices,
} from "@/lib/data-sources/pokemon-tcg";

// POST /api/seed?tcg=pokemon&sets=sv8,sv8pt5 (optional filter)
// or POST /api/seed?tcg=pokemon&all=true (seed ALL sets)
export async function POST(req: NextRequest) {
  // Simple auth check
  const authHeader = req.headers.get("authorization");
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tcg = req.nextUrl.searchParams.get("tcg") || "pokemon";
  const setsFilter = req.nextUrl.searchParams.get("sets")?.split(",") || [];
  const seedAll = req.nextUrl.searchParams.get("all") === "true";

  if (tcg !== "pokemon") {
    return NextResponse.json({ error: "Only pokemon supported for now" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const log: string[] = [];

    // 1. Fetch all sets from Pokemon TCG API
    log.push("Fetching sets from Pokemon TCG API...");
    const allSets = await fetchAllSets();
    log.push(`Found ${allSets.length} sets`);

    // Filter sets if specified
    const setsToSeed = seedAll
      ? allSets
      : setsFilter.length > 0
        ? allSets.filter((s) => setsFilter.includes(s.id))
        : allSets.slice(0, 5); // Default: latest 5 sets

    log.push(`Seeding ${setsToSeed.length} sets...`);

    // 2. Upsert sets
    const setRows = setsToSeed.map(mapSetToDB);
    const { error: setsError } = await supabase
      .from("sets")
      .upsert(setRows, { onConflict: "id" });

    if (setsError) {
      log.push(`Sets error: ${setsError.message}`);
      return NextResponse.json({ error: setsError.message, log }, { status: 500 });
    }
    log.push(`Upserted ${setRows.length} sets`);

    // 3. Fetch and upsert cards per set
    let totalCards = 0;
    let totalPrices = 0;

    for (const set of setsToSeed) {
      log.push(`Fetching cards for ${set.name} (${set.id})...`);
      const cards = await fetchCardsBySet(set.id);
      log.push(`  Found ${cards.length} cards`);

      // Upsert cards in batches of 100
      const cardRows = cards.map(mapCardToDB);
      for (let i = 0; i < cardRows.length; i += 100) {
        const batch = cardRows.slice(i, i + 100);
        const { error: cardsError } = await supabase
          .from("cards")
          .upsert(batch, { onConflict: "id" });

        if (cardsError) {
          log.push(`  Cards batch error: ${cardsError.message}`);
        }
      }
      totalCards += cards.length;

      // Extract and insert initial prices from API data
      const allPrices = cards.flatMap(extractPrices).filter((p) => p.price > 0);
      if (allPrices.length > 0) {
        for (let i = 0; i < allPrices.length; i += 100) {
          const batch = allPrices.slice(i, i + 100);
          await supabase.from("prices").insert(batch);
        }

        // Upsert price summaries
        const summaries = allPrices.map((p) => ({
          card_id: p.card_id,
          current_price: p.price,
          previous_price: p.price,
          price_change_24h: 0,
        }));
        // Deduplicate by card_id (keep first/highest price)
        const uniqueSummaries = Object.values(
          summaries.reduce((acc, s) => {
            if (!acc[s.card_id] || s.current_price > acc[s.card_id].current_price) {
              acc[s.card_id] = s;
            }
            return acc;
          }, {} as Record<string, typeof summaries[0]>)
        );

        for (let i = 0; i < uniqueSummaries.length; i += 100) {
          const batch = uniqueSummaries.slice(i, i + 100);
          await supabase
            .from("price_summaries")
            .upsert(batch, { onConflict: "card_id" });
        }
        totalPrices += allPrices.length;
      }

      log.push(`  Seeded ${cards.length} cards, ${allPrices.length} prices`);

      // Respect rate limits
      await new Promise((r) => setTimeout(r, 1000));
    }

    // 4. Update card counts on sets and tcgs
    for (const set of setsToSeed) {
      const { count } = await supabase
        .from("cards")
        .select("*", { count: "exact", head: true })
        .eq("set_id", set.id);

      await supabase.from("sets").update({ card_count: count || 0 }).eq("id", set.id);
    }

    const { count: totalPokemonCards } = await supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("tcg_id", "pokemon");

    await supabase
      .from("tcgs")
      .update({ card_count: totalPokemonCards || 0 })
      .eq("id", "pokemon");

    log.push(`\nDone! Total: ${totalCards} cards, ${totalPrices} prices across ${setsToSeed.length} sets`);

    return NextResponse.json({
      success: true,
      stats: {
        sets: setsToSeed.length,
        cards: totalCards,
        prices: totalPrices,
      },
      log,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
