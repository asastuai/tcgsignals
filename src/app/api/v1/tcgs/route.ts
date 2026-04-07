import { NextRequest } from "next/server";
import {
  getRateLimitKey, checkRateLimit, apiSuccess, apiError, apiRateLimited,
  getSupabase,
} from "@/lib/api";

// GET /api/v1/tcgs
export async function GET(req: NextRequest) {
  const rlKey = getRateLimitKey(req);
  const rl = checkRateLimit(rlKey);
  if (!rl.allowed) return apiRateLimited(rl.resetAt);

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("tcgs").select("*");

    if (error) return apiError(error.message, 500);

    return apiSuccess((data || []).map((t: Record<string, unknown>) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      card_count: t.card_count,
    })));
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Internal error", 500);
  }
}
