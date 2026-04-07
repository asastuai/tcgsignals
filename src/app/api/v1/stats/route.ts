import { NextRequest } from "next/server";
import {
  getRateLimitKey, checkRateLimit, apiSuccess, apiError, apiRateLimited,
  getSupabase,
} from "@/lib/api";

// GET /api/v1/stats — global platform statistics
export async function GET(req: NextRequest) {
  const rlKey = getRateLimitKey(req);
  const rl = checkRateLimit(rlKey);
  if (!rl.allowed) return apiRateLimited(rl.resetAt);

  try {
    const supabase = getSupabase();

    const [
      { count: totalCards },
      { count: totalSets },
      { count: totalPricePoints },
      { count: cardsWithPrice },
    ] = await Promise.all([
      supabase.from("cards").select("*", { count: "exact", head: true }),
      supabase.from("sets").select("*", { count: "exact", head: true }),
      supabase.from("prices").select("*", { count: "exact", head: true }),
      supabase.from("cards").select("*", { count: "exact", head: true }).not("current_price", "is", null),
    ]);

    // Top 5 most expensive cards
    const { data: topCards } = await supabase
      .from("cards")
      .select("id, name, tcg_id, current_price, image_small")
      .not("current_price", "is", null)
      .order("current_price", { ascending: false })
      .limit(5);

    return apiSuccess({
      total_cards: totalCards || 0,
      total_sets: totalSets || 0,
      total_price_points: totalPricePoints || 0,
      cards_with_prices: cardsWithPrice || 0,
      tcgs_supported: ["pokemon", "onepiece"],
      top_cards: (topCards || []).map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        tcg: c.tcg_id,
        price: c.current_price,
        image: c.image_small,
      })),
      api_version: "1.0.0",
      rate_limits: {
        free: "100 requests/minute",
        premium: "1000 requests/minute",
      },
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Internal error", 500);
  }
}
