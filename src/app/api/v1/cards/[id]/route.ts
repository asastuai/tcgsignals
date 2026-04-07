import { NextRequest } from "next/server";
import {
  getRateLimitKey, checkRateLimit, apiSuccess, apiError, apiRateLimited,
  getSupabase, CARD_API_FIELDS, formatCard,
} from "@/lib/api";

// GET /api/v1/cards/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rlKey = getRateLimitKey(req);
  const rl = checkRateLimit(rlKey);
  if (!rl.allowed) return apiRateLimited(rl.resetAt);

  try {
    const { id } = await params;
    const supabase = getSupabase();

    const select = `
      ${CARD_API_FIELDS},
      sets:set_id (id, name, series, release_date),
      price_summaries (
        current_price, previous_price, price_change_24h, price_change_7d,
        low_30d, high_30d, avg_30d,
        last_sold_price, last_sold_platform, last_sold_date, last_sold_condition,
        volume_24h
      )
    `;

    const { data, error } = await supabase
      .from("cards")
      .select(select)
      .eq("id", id)
      .single();

    if (error || !data) return apiError("Card not found", 404);

    const row = data as Record<string, unknown>;
    const sets = row.sets as Record<string, unknown> | null;
    const ps = row.price_summaries as Record<string, unknown>[] | Record<string, unknown> | null;
    const p = Array.isArray(ps) ? ps[0] : ps;

    return apiSuccess({
      ...formatCard(row),
      set: sets ? {
        id: sets.id,
        name: sets.name,
        series: sets.series,
        release_date: sets.release_date,
      } : null,
      market_data: p ? {
        current_price: p.current_price,
        previous_price: p.previous_price,
        change_24h: p.price_change_24h,
        change_7d: p.price_change_7d,
        low_30d: p.low_30d,
        high_30d: p.high_30d,
        avg_30d: p.avg_30d,
        last_sold: p.last_sold_price ? {
          price: p.last_sold_price,
          platform: p.last_sold_platform,
          date: p.last_sold_date,
          condition: p.last_sold_condition,
        } : null,
        volume_24h: p.volume_24h,
      } : null,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Internal error", 500);
  }
}
