import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Rate Limiting (in-memory, per-instance — good enough for Vercel)
// ============================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS = {
  free: { requests: 100, windowMs: 60 * 1000 },      // 100 req/min
  premium: { requests: 1000, windowMs: 60 * 1000 },   // 1000 req/min
};

export function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const apiKey = req.headers.get("x-api-key") || "";
  return apiKey || ip;
}

export function checkRateLimit(key: string, tier: "free" | "premium" = "free"): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const limit = RATE_LIMITS[tier];
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, remaining: limit.requests - 1, resetAt: now + limit.windowMs };
  }

  if (entry.count >= limit.requests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit.requests - entry.count, resetAt: entry.resetAt };
}

// ============================================================
// API Response Helpers
// ============================================================

interface APIResponseMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export function apiSuccess(data: unknown, meta?: APIResponseMeta) {
  return NextResponse.json({
    status: "ok",
    ...(meta ? { meta } : {}),
    data,
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json(
    { status: "error", message },
    {
      status,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export function apiRateLimited(resetAt: number) {
  return NextResponse.json(
    {
      status: "error",
      message: "Rate limit exceeded. Upgrade to premium for higher limits.",
      resetAt: new Date(resetAt).toISOString(),
    },
    {
      status: 429,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  );
}

// ============================================================
// Query Param Helpers
// ============================================================

export function getPageParams(req: NextRequest): { page: number; pageSize: number } {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("pageSize") || "48", 10)));
  return { page, pageSize };
}

export function getSupabase() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Standard card fields returned by the API
export const CARD_API_FIELDS = `
  id, name, tcg_id, set_id, number, rarity,
  supertype, subtypes, types, hp, artist,
  image_small, image_large,
  current_price, price_change_24h,
  tcgplayer_url, cardmarket_url
`;

export const SET_API_FIELDS = `
  id, tcg_id, name, slug, code, release_date,
  card_count, total_printed, image_url, series
`;

export function formatCard(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    tcg: row.tcg_id,
    set_id: row.set_id,
    number: row.number,
    rarity: row.rarity,
    supertype: row.supertype,
    subtypes: row.subtypes,
    types: row.types,
    hp: row.hp,
    artist: row.artist,
    images: {
      small: row.image_small,
      large: row.image_large,
    },
    prices: {
      current: row.current_price,
      change_24h: row.price_change_24h,
    },
    links: {
      tcgplayer: row.tcgplayer_url || null,
      cardmarket: row.cardmarket_url || null,
    },
  };
}

export function formatSet(row: Record<string, unknown>) {
  return {
    id: row.id,
    tcg: row.tcg_id,
    name: row.name,
    code: row.code,
    series: row.series,
    release_date: row.release_date,
    card_count: row.card_count,
    total_printed: row.total_printed,
    image_url: row.image_url,
  };
}
