import { NextRequest } from "next/server";
import {
  getRateLimitKey, checkRateLimit, apiSuccess, apiError, apiRateLimited,
  getSupabase, CARD_API_FIELDS, formatCard, getPageParams,
} from "@/lib/api";

// GET /api/v1/search?q=charizard&tcg=pokemon&page=1&pageSize=48
export async function GET(req: NextRequest) {
  const rlKey = getRateLimitKey(req);
  const rl = checkRateLimit(rlKey);
  if (!rl.allowed) return apiRateLimited(rl.resetAt);

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return apiError("Query parameter 'q' is required (min 2 characters)", 400);
  }

  try {
    const supabase = getSupabase();
    const { page, pageSize } = getPageParams(req);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const tcg = req.nextUrl.searchParams.get("tcg");

    let query = supabase
      .from("cards")
      .select(CARD_API_FIELDS, { count: "exact" })
      .textSearch("search_vector", q.trim(), { type: "websearch" });

    if (tcg) query = query.eq("tcg_id", tcg);

    query = query
      .order("current_price", { ascending: false, nullsFirst: false })
      .range(from, to);

    const { data, count, error } = await query;
    if (error) return apiError(error.message, 500);

    const total = count || 0;

    return apiSuccess(
      (data || []).map((r: Record<string, unknown>) => formatCard(r as Record<string, unknown>)),
      { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    );
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Internal error", 500);
  }
}
