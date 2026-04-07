import { NextRequest } from "next/server";
import {
  getRateLimitKey, checkRateLimit, apiSuccess, apiError, apiRateLimited,
  getSupabase,
} from "@/lib/api";

// GET /api/v1/cards/:id/prices?days=90
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rlKey = getRateLimitKey(req);
  const rl = checkRateLimit(rlKey);
  if (!rl.allowed) return apiRateLimited(rl.resetAt);

  try {
    const { id } = await params;
    const days = Math.min(365, Math.max(1, parseInt(req.nextUrl.searchParams.get("days") || "90", 10)));
    const supabase = getSupabase();

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from("prices")
      .select("price, recorded_at, source, condition")
      .eq("card_id", id)
      .gte("recorded_at", since.toISOString())
      .order("recorded_at", { ascending: true });

    if (error) return apiError(error.message, 500);

    // Also fetch platform listings
    const { data: listings } = await supabase
      .from("platform_listings")
      .select("platform, price, condition, url, last_checked")
      .eq("card_id", id)
      .order("price", { ascending: true });

    return apiSuccess({
      card_id: id,
      days,
      history: (data || []).map((p: Record<string, unknown>) => ({
        date: (p.recorded_at as string).split("T")[0],
        price: Number(p.price),
        source: p.source,
        condition: p.condition,
      })),
      platforms: (listings || []).map((l: Record<string, unknown>) => ({
        platform: l.platform,
        price: Number(l.price),
        condition: l.condition,
        url: l.url,
        last_checked: l.last_checked,
      })),
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Internal error", 500);
  }
}
