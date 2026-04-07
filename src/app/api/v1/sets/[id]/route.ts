import { NextRequest } from "next/server";
import {
  getRateLimitKey, checkRateLimit, apiSuccess, apiError, apiRateLimited,
  getSupabase, SET_API_FIELDS, CARD_API_FIELDS, formatSet, formatCard, getPageParams,
} from "@/lib/api";

// GET /api/v1/sets/:id — set info + cards in set
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
    const { page, pageSize } = getPageParams(req);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch set info
    const { data: setData, error: setError } = await supabase
      .from("sets")
      .select(SET_API_FIELDS)
      .eq("id", id)
      .single();

    if (setError || !setData) return apiError("Set not found", 404);

    // Fetch cards in set
    const { data: cards, count, error: cardsError } = await supabase
      .from("cards")
      .select(CARD_API_FIELDS, { count: "exact" })
      .eq("set_id", id)
      .order("number_sort", { ascending: true, nullsFirst: false })
      .range(from, to);

    if (cardsError) return apiError(cardsError.message, 500);

    const total = count || 0;

    return apiSuccess({
      set: formatSet(setData as Record<string, unknown>),
      cards: (cards || []).map((r: Record<string, unknown>) => formatCard(r as Record<string, unknown>)),
    }, { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Internal error", 500);
  }
}
