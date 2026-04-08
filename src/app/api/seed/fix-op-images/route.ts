import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// POST /api/seed/fix-op-images
// Migrates One Piece card images from en.onepiece-cardgame.com to optcgapi.com
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();

    // Get all One Piece cards with old image URLs
    const { data: cards, error } = await supabase
      .from("cards")
      .select("id, image_small, image_large, tcg_external_id")
      .eq("tcg_id", "onepiece");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!cards) return NextResponse.json({ updated: 0 });

    let updated = 0;
    for (const card of cards) {
      const extId = card.tcg_external_id as string;
      if (!extId) continue;

      const newUrl = `https://www.optcgapi.com/media/static/Card_Images/${extId}.jpg`;
      const currentSmall = (card.image_small as string) || "";

      // Only update if URL is from the old domain or empty
      if (currentSmall.includes("onepiece-cardgame.com") || !currentSmall) {
        const { error: updateError } = await supabase
          .from("cards")
          .update({ image_small: newUrl, image_large: newUrl })
          .eq("id", card.id);

        if (!updateError) updated++;
      }
    }

    return NextResponse.json({ success: true, total: cards.length, updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
