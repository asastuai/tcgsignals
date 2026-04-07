import { NextRequest } from "next/server";
import {
  getRateLimitKey, checkRateLimit, apiSuccess, apiError, apiRateLimited,
  getPageParams, getSupabase, CARD_API_FIELDS, formatCard,
} from "@/lib/api";

// GET /api/v1/cards?tcg=pokemon&set=sv8&rarity=...&sort=price-desc&page=1&pageSize=48
export async function GET(req: NextRequest) {
  const rlKey = getRateLimitKey(req);
  const rl = checkRateLimit(rlKey);
  if (!rl.allowed) return apiRateLimited(rl.resetAt);

  try {
    const supabase = getSupabase();
    const { page, pageSize } = getPageParams(req);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const tcg = req.nextUrl.searchParams.get("tcg");
    const set = req.nextUrl.searchParams.get("set");
    const rarity = req.nextUrl.searchParams.get("rarity");
    const sort = req.nextUrl.searchParams.get("sort") || "price-desc";

    let query = supabase.from("cards").select(CARD_API_FIELDS, { count: "exact" });

    if (tcg) query = query.eq("tcg_id", tcg);
    if (set) query = query.eq("set_id", set);
    if (rarity) query = query.eq("rarity", rarity);

    switch (sort) {
      case "price-desc": query = query.order("current_price", { ascending: false, nullsFirst: false }); break;
      case "price-asc": query = query.order("current_price", { ascending: true, nullsFirst: false }); break;
      case "change-desc": query = query.order("price_change_24h", { ascending: false, nullsFirst: false }); break;
      case "change-asc": query = query.order("price_change_24h", { ascending: true, nullsFirst: false }); break;
      case "name-asc": query = query.order("name", { ascending: true }); break;
      case "name-desc": query = query.order("name", { ascending: false }); break;
      case "number": query = query.order("number_sort", { ascending: true, nullsFirst: false }); break;
      default: query = query.order("current_price", { ascending: false, nullsFirst: false });
    }

    query = query.range(from, to);
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
