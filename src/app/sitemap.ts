import type { MetadataRoute } from "next"
import { createSupabaseClient } from "@/lib/supabase"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tcg-signals.vercel.app"

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/explorer`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/sets`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ]

  let supabase
  try {
    supabase = createSupabaseClient()
  } catch {
    return staticRoutes
  }

  // Add set pages
  const { data: sets } = await supabase.from("sets").select("id") as { data: { id: string }[] | null }
  const setRoutes: MetadataRoute.Sitemap = (sets || []).map((s) => ({
    url: `${baseUrl}/sets/${s.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  // Add top card pages (cards with highest price — limit to keep sitemap manageable)
  const { data: cards } = await supabase
    .from("cards")
    .select("id")
    .not("current_price", "is", null)
    .order("current_price", { ascending: false })
    .limit(1000) as { data: { id: string }[] | null }

  const cardRoutes: MetadataRoute.Sitemap = (cards || []).map((c) => ({
    url: `${baseUrl}/card/${c.id}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...setRoutes, ...cardRoutes]
}
