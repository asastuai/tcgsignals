import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "API Documentation",
  description: "TCGSignals REST API documentation. Access 21,000+ card prices, sets, and market data for Pokemon and One Piece TCGs.",
}

const BASE = "https://tcg-signals.vercel.app/api/v1"

interface Endpoint {
  method: string
  path: string
  description: string
  params?: { name: string; type: string; desc: string; required?: boolean }[]
  example: string
  response: string
}

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/cards",
    description: "List cards with optional filters and pagination.",
    params: [
      { name: "tcg", type: "string", desc: "Filter by TCG: pokemon, onepiece" },
      { name: "set", type: "string", desc: "Filter by set ID" },
      { name: "rarity", type: "string", desc: "Filter by rarity (e.g., Rare, Ultra Rare)" },
      { name: "sort", type: "string", desc: "Sort: price-desc (default), price-asc, change-desc, change-asc, name-asc, name-desc, number" },
      { name: "page", type: "number", desc: "Page number (default: 1)" },
      { name: "pageSize", type: "number", desc: "Items per page (default: 48, max: 100)" },
    ],
    example: `${BASE}/cards?tcg=pokemon&sort=price-desc&page=1&pageSize=10`,
    response: `{
  "data": [{ "id": "sv8-001", "name": "Charizard ex", "price": 42.50, ... }],
  "total": 20237,
  "page": 1,
  "pageSize": 10
}`,
  },
  {
    method: "GET",
    path: "/cards/:id",
    description: "Get a single card with full market data.",
    params: [{ name: "id", type: "string", desc: "Card ID", required: true }],
    example: `${BASE}/cards/sv8-001`,
    response: `{
  "data": {
    "id": "sv8-001",
    "name": "Charizard ex",
    "set": "Surging Sparks",
    "tcg": "Pokemon",
    "price": 42.50,
    "change24h": 3.2,
    "change7d": -1.5,
    "rarity": "Ultra Rare",
    "image": "https://images.pokemontcg.io/sv8/1_hires.png"
  }
}`,
  },
  {
    method: "GET",
    path: "/cards/:id/prices",
    description: "Get price history for a card over time.",
    params: [
      { name: "id", type: "string", desc: "Card ID", required: true },
      { name: "days", type: "number", desc: "Number of days of history (default: 90)" },
    ],
    example: `${BASE}/cards/sv8-001/prices?days=30`,
    response: `{
  "data": [
    { "date": "2025-03-01", "price": 40.00 },
    { "date": "2025-03-02", "price": 41.25 }
  ]
}`,
  },
  {
    method: "GET",
    path: "/sets",
    description: "List all card sets.",
    params: [{ name: "tcg", type: "string", desc: "Filter by TCG: pokemon, onepiece" }],
    example: `${BASE}/sets?tcg=pokemon`,
    response: `{
  "data": [
    { "id": "sv8", "name": "Surging Sparks", "series": "Scarlet & Violet", "cardCount": 252 }
  ]
}`,
  },
  {
    method: "GET",
    path: "/sets/:id",
    description: "Get a single set with its cards.",
    params: [{ name: "id", type: "string", desc: "Set ID", required: true }],
    example: `${BASE}/sets/sv8`,
    response: `{
  "data": {
    "id": "sv8",
    "name": "Surging Sparks",
    "cardCount": 252,
    "cards": [...]
  }
}`,
  },
  {
    method: "GET",
    path: "/search",
    description: "Full-text search across all cards.",
    params: [
      { name: "q", type: "string", desc: "Search query", required: true },
      { name: "tcg", type: "string", desc: "Filter by TCG" },
      { name: "page", type: "number", desc: "Page number" },
      { name: "pageSize", type: "number", desc: "Items per page" },
    ],
    example: `${BASE}/search?q=charizard&tcg=pokemon`,
    response: `{
  "data": [{ "id": "sv8-001", "name": "Charizard ex", ... }],
  "total": 45
}`,
  },
  {
    method: "GET",
    path: "/tcgs",
    description: "List supported TCGs with card counts.",
    example: `${BASE}/tcgs`,
    response: `{
  "data": [
    { "name": "Pokemon", "cardCount": 20237 },
    { "name": "One Piece", "cardCount": 1143 }
  ]
}`,
  },
  {
    method: "GET",
    path: "/stats",
    description: "Global platform statistics.",
    example: `${BASE}/stats`,
    response: `{
  "data": {
    "totalCards": 21380,
    "totalSets": 184,
    "totalPricePoints": 1900000,
    "supportedTcgs": 2
  }
}`,
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">API Documentation</h1>
          <p className="mt-2 text-muted-foreground">
            Access real-time TCG price data for 21,000+ cards across Pokemon and One Piece.
          </p>
          <div className="mt-4 rounded-lg border border-border/60 bg-card px-4 py-3">
            <div className="text-xs text-muted-foreground">Base URL</div>
            <code className="text-sm font-mono text-foreground">{BASE}</code>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="mb-8 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Rate Limits</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="text-sm font-medium text-foreground">Free Tier</div>
              <div className="mt-0.5 font-mono text-2xl font-bold text-foreground">100<span className="text-sm text-muted-foreground"> /min</span></div>
              <div className="mt-1 text-xs text-muted-foreground">No authentication required</div>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <div className="text-sm font-medium text-foreground">Premium</div>
              <div className="mt-0.5 font-mono text-2xl font-bold text-primary">1,000<span className="text-sm text-muted-foreground"> /min</span></div>
              <div className="mt-1 text-xs text-muted-foreground">Send <code className="rounded bg-secondary px-1 text-foreground">x-api-key</code> header</div>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <h2 className="mb-4 text-lg font-semibold text-foreground">Endpoints</h2>
        <div className="flex flex-col gap-6">
          {endpoints.map((ep) => (
            <div key={ep.path} id={ep.path.replace(/[/:]/g, "-")} className="rounded-xl border border-border/60 bg-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border/40 px-5 py-3">
                <span className="rounded bg-success/15 px-2 py-0.5 text-xs font-bold text-success">{ep.method}</span>
                <code className="text-sm font-mono text-foreground">{ep.path}</code>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground">{ep.description}</p>

                {/* Params */}
                {ep.params && ep.params.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40">
                            <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                            <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                            <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((p) => (
                            <tr key={p.name} className="border-b border-border/20">
                              <td className="py-2 pr-4">
                                <code className="text-xs font-mono text-foreground">{p.name}</code>
                                {p.required && <span className="ml-1 text-[10px] text-destructive">required</span>}
                              </td>
                              <td className="py-2 pr-4 text-xs text-muted-foreground">{p.type}</td>
                              <td className="py-2 text-xs text-muted-foreground">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Example */}
                <div className="mt-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Example Request</h4>
                  <pre className="overflow-x-auto rounded-lg bg-[#0B0F1A] p-3 text-xs">
                    <code className="text-muted-foreground">GET </code>
                    <code className="text-foreground break-all">{ep.example}</code>
                  </pre>
                </div>

                {/* Response */}
                <div className="mt-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Example Response</h4>
                  <pre className="overflow-x-auto rounded-lg bg-[#0B0F1A] p-3 text-xs">
                    <code className="text-green-400">{ep.response}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
