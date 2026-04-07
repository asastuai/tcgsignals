import { NextRequest } from "next/server";
import {
  getRateLimitKey, checkRateLimit, apiSuccess, apiError, apiRateLimited,
  getSupabase, SET_API_FIELDS, formatSet,
} from "@/lib/api";

// GET /api/v1/sets?tcg=pokemon
export async function GET(req: NextRequest) {
  const rlKey = getRateLimitKey(req);
  const rl = checkRateLimit(rlKey);
  if (!rl.allowed) return apiRateLimited(rl.resetAt);

  try {
    const supabase = getSupabase();
    const tcg = req.nextUrl.searchParams.get("tcg");

    let query = supabase.from("sets").select(SET_API_FIELDS).order("release_date", { ascending: false });
    if (tcg) query = query.eq("tcg_id", tcg);

    const { data, error } = await query;
    if (error) return apiError(error.message, 500);

    return apiSuccess((data || []).map((r: Record<string, unknown>) => formatSet(r as Record<string, unknown>)));
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Internal error", 500);
  }
}
