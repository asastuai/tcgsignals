import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

async function runMigration() {
  const supabase = createSupabaseAdmin();

  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, image_small, image_large, tcg_external_id")
    .eq("tcg_id", "onepiece");

  if (error) return { error: error.message };
  if (!cards) return { success: true, total: 0, updated: 0 };

  let updated = 0;
  for (const card of cards) {
    const extId = card.tcg_external_id as string;
    if (!extId) continue;

    const newUrl = `https://www.optcgapi.com/media/static/Card_Images/${extId}.jpg`;
    const currentSmall = (card.image_small as string) || "";

    if (currentSmall.includes("onepiece-cardgame.com") || !currentSmall) {
      const { error: updateError } = await supabase
        .from("cards")
        .update({ image_small: newUrl, image_large: newUrl })
        .eq("id", card.id);

      if (!updateError) updated++;
    }
  }

  return { success: true, total: cards.length, updated };
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return false;

  // Check header auth
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  // Check query param auth (for browser access)
  const key = req.nextUrl.searchParams.get("key");
  if (key === secret) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized. Add ?key=YOUR_SERVICE_ROLE_KEY" }, { status: 401 });
  }

  try {
    const result = await runMigration();
    if (result.error) return NextResponse.json(result, { status: 500 });
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
    const result = await runMigration();
    if (result.error) return NextResponse.json(result, { status: 500 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
