import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { ONEPIECE_SETS, mapOnePieceSetToDB, getOnePieceImageUrl } from "@/lib/data-sources/onepiece-tcg";

// POST /api/seed/onepiece
// Seeds One Piece sets and attempts to discover cards by probing image URLs
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const log: string[] = [];

    // 1. Seed sets
    const setRows = ONEPIECE_SETS.map(mapOnePieceSetToDB);
    const { error: setsError } = await supabase
      .from("sets")
      .upsert(setRows, { onConflict: "id" });

    if (setsError) {
      return NextResponse.json({ error: setsError.message }, { status: 500 });
    }
    log.push(`Upserted ${setRows.length} One Piece sets`);

    // 2. For each set, probe card IDs by checking if images exist
    // One Piece cards follow the pattern: {SET_CODE}-{NUMBER}
    // e.g., OP09-001, OP09-002, ..., OP09-120
    let totalCards = 0;

    for (const set of ONEPIECE_SETS) {
      const setCode = set.code.replace("-", ""); // OP-09 -> OP09
      const maxCards = set.code.startsWith("ST") ? 20 : set.code.startsWith("EB") ? 30 : 130;

      const cards: Array<{
        id: string;
        tcg_id: string;
        set_id: string;
        name: string;
        number: string;
        rarity: string;
        supertype: string;
        image_small: string;
        image_large: string;
        tcg_external_id: string;
      }> = [];

      // Probe card IDs
      for (let n = 1; n <= maxCards; n++) {
        const num = String(n).padStart(3, "0");
        const cardId = `${setCode}-${num}`;
        const imageUrl = getOnePieceImageUrl(cardId);

        // Check if image exists (HEAD request)
        try {
          const res = await fetch(imageUrl, {
            method: "HEAD",
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Referer": "https://en.onepiece-cardgame.com/",
            },
          });

          if (res.ok) {
            // Determine rarity based on card number range (heuristic)
            let rarity = "C";
            if (n <= 2) rarity = "L";         // Leaders are first
            else if (n > maxCards - 5) rarity = "SEC"; // Secret rares at end
            else if (n > maxCards - 15) rarity = "SR"; // Super rares before SEC
            else if (n > maxCards - 40) rarity = "R";  // Rares
            else if (n > maxCards - 70) rarity = "UC"; // Uncommon

            cards.push({
              id: `op-${cardId.toLowerCase()}`,
              tcg_id: "onepiece",
              set_id: set.id,
              name: `${set.name} #${cardId}`, // Placeholder name until we can scrape real names
              number: cardId,
              rarity,
              supertype: n <= 2 ? "Leader" : "Character",
              image_small: imageUrl,
              image_large: imageUrl,
              tcg_external_id: cardId,
            });
          }
        } catch {
          // Image doesn't exist, skip
        }
      }

      if (cards.length > 0) {
        // Upsert in batches
        for (let i = 0; i < cards.length; i += 100) {
          const batch = cards.slice(i, i + 100);
          await supabase.from("cards").upsert(batch, { onConflict: "id" });
        }

        // Update set card count
        await supabase.from("sets").update({ card_count: cards.length }).eq("id", set.id);
      }

      totalCards += cards.length;
      log.push(`${set.name}: found ${cards.length} cards`);

      // Rate limit between sets
      await new Promise((r) => setTimeout(r, 500));
    }

    // Update tcg total
    await supabase.from("tcgs").update({ card_count: totalCards }).eq("id", "onepiece");

    log.push(`\nTotal: ${totalCards} One Piece cards discovered`);

    return NextResponse.json({
      success: true,
      stats: { sets: ONEPIECE_SETS.length, cards: totalCards },
      log,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
