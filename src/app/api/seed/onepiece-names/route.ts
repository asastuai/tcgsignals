import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// The official One Piece TCG site uses series IDs for card lists
// We fetch the HTML and parse card data from the structured content
const SERIES_IDS: Record<string, string> = {
  "OP-09": "569901",
  "OP-08": "569801",
  "OP-07": "569701",
  "OP-06": "569601",
  "OP-05": "569501",
  "OP-04": "569401",
  "OP-03": "569301",
  "OP-02": "569201",
  "OP-01": "569101",
  "EB-01": "570101",
  "ST-01": "568101",
  "ST-10": "569001",
};

interface ParsedCard {
  id: string;
  name: string;
  rarity: string;
  color: string;
  cardType: string;
  cost: string;
  power: string;
}

async function fetchCardsFromOfficialSite(seriesId: string): Promise<ParsedCard[]> {
  const url = `https://en.onepiece-cardgame.com/cardlist/?series=${seriesId}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) return [];

  const html = await res.text();
  const cards: ParsedCard[] = [];

  // Parse card data from the HTML
  // The site uses data attributes and structured divs for each card
  // Pattern: <a ... data-src="...OP09-001.png" ... >
  //          <div class="resultCol">card name</div>
  //          etc.

  // Extract card blocks - look for card ID patterns in the HTML
  const cardIdRegex = /([A-Z]{2}\d{2}-\d{3})/g;
  const foundIds = new Set<string>();
  let match;

  while ((match = cardIdRegex.exec(html)) !== null) {
    foundIds.add(match[1]);
  }

  // Try to extract name from surrounding context for each card ID
  for (const cardId of foundIds) {
    // Look for the card name near the card ID in the HTML
    // The site structure has card names in specific elements near the card ID
    const idIndex = html.indexOf(cardId);
    if (idIndex === -1) continue;

    // Get a chunk around the card ID to parse
    const start = Math.max(0, idIndex - 2000);
    const end = Math.min(html.length, idIndex + 2000);
    const chunk = html.substring(start, end);

    // Extract card name - typically in an element after the ID
    // Look for patterns like: >Card Name<
    let name = "";

    // Try to find name in common HTML patterns
    const namePatterns = [
      new RegExp(`${cardId}[^<]*<[^>]*>[^<]*<[^>]*class="[^"]*cardName[^"]*"[^>]*>([^<]+)`, "i"),
      new RegExp(`data-name="([^"]+)"[^>]*${cardId}`, "i"),
      new RegExp(`${cardId}[^}]*"name"\\s*:\\s*"([^"]+)"`, "i"),
    ];

    for (const pattern of namePatterns) {
      const nameMatch = pattern.exec(chunk);
      if (nameMatch) {
        name = nameMatch[1].trim();
        break;
      }
    }

    // Extract rarity
    let rarity = "";
    const rarityMatch = /class="[^"]*"[^>]*>\s*(L|SEC|SR|R|UC|C)\s*</.exec(chunk);
    if (rarityMatch) rarity = rarityMatch[1];

    if (name) {
      cards.push({
        id: cardId,
        name,
        rarity,
        color: "",
        cardType: "",
        cost: "",
        power: "",
      });
    }
  }

  return cards;
}

// Alternative approach: use a simple JSON API if available
async function fetchCardsFromAPI(seriesId: string): Promise<ParsedCard[]> {
  // Try the API endpoint that the card list page itself uses
  const url = `https://en.onepiece-cardgame.com/cardlist/api/?series=${seriesId}&limit=200`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://en.onepiece-cardgame.com/cardlist/",
      },
    });

    if (!res.ok) return [];

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("json")) return [];

    const data = await res.json();

    if (Array.isArray(data)) {
      return data.map((card: Record<string, string>) => ({
        id: card.number || card.id || "",
        name: card.name || card.cardName || "",
        rarity: card.rarity || "",
        color: card.color || "",
        cardType: card.cardType || card.type || "",
        cost: card.cost || "",
        power: card.power || "",
      }));
    }
  } catch {
    // API not available, will use HTML scraping
  }

  return [];
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const log: string[] = [];
    let totalUpdated = 0;

    for (const [setCode, seriesId] of Object.entries(SERIES_IDS)) {
      // Try API first, fallback to HTML scraping
      let cards = await fetchCardsFromAPI(seriesId);
      const source = cards.length > 0 ? "API" : "HTML";

      if (cards.length === 0) {
        cards = await fetchCardsFromOfficialSite(seriesId);
      }

      log.push(`${setCode}: found ${cards.length} cards via ${source}`);

      if (cards.length > 0) {
        // Update card names in database
        let updated = 0;
        for (const card of cards) {
          if (!card.name || !card.id) continue;

          const dbId = `op-${card.id.toLowerCase()}`;
          const updateData: Record<string, string | string[]> = { name: card.name };

          if (card.rarity) updateData.rarity = card.rarity;
          if (card.cardType) updateData.supertype = card.cardType;
          if (card.color) updateData.types = [card.color];
          if (card.power) updateData.hp = card.power;

          const { error } = await supabase
            .from("cards")
            .update(updateData)
            .eq("id", dbId);

          if (!error) updated++;
        }

        log.push(`  Updated ${updated} card names`);
        totalUpdated += updated;
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 1000));
    }

    log.push(`\nTotal updated: ${totalUpdated}`);

    return NextResponse.json({ success: true, updated: totalUpdated, log });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
