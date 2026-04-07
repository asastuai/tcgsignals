/**
 * Generate realistic 90-day price history for all cards with current prices.
 * Uses random walk with mean reversion to simulate TCG market behavior:
 * - High-value cards: lower volatility (5-8%), more stable
 * - Mid-value cards: moderate volatility (8-15%)
 * - Low-value cards: higher volatility (15-25%)
 * - Adds trend component (cards generally appreciate over 90 days)
 *
 * Run: npx tsx scripts/seed-price-history.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getVolatility(price: number): number {
  if (price > 100) return 0.015;   // 1.5% daily for expensive cards
  if (price > 20) return 0.025;    // 2.5% daily for mid-range
  if (price > 5) return 0.035;     // 3.5% daily for budget
  return 0.05;                      // 5% daily for cheap cards
}

function generateHistory(currentPrice: number, days: number): { date: string; price: number }[] {
  const vol = getVolatility(currentPrice);
  const points: { date: string; price: number }[] = [];

  // Work backwards from current price
  // The price 90 days ago was likely 5-20% different
  const trendFactor = 1 + (Math.random() * 0.2 - 0.05); // -5% to +15% over 90 days
  const startPrice = currentPrice / trendFactor;

  let price = startPrice;
  const dailyTrend = (currentPrice - startPrice) / days;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random walk with mean reversion
    const noise = (Math.random() - 0.5) * 2 * vol * price;
    const targetPrice = startPrice + dailyTrend * (days - i);
    const reversion = (targetPrice - price) * 0.1; // 10% mean reversion

    price = Math.max(price + noise + reversion + dailyTrend, currentPrice * 0.3);

    // Snap last day to actual current price
    if (i === 0) price = currentPrice;

    points.push({
      date: date.toISOString(),
      price: parseFloat(price.toFixed(2)),
    });
  }

  return points;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing env vars");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // First, delete old synthetic/single-point price data
  console.log("Clearing old price history...");
  await supabase.from("prices").delete().neq("id", 0); // delete all
  console.log("Cleared.");

  // Get all cards with prices (paginated, Supabase default limit is 1000)
  const cards: Array<{ id: string; current_price: number; tcg_id: string }> = [];
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("cards")
      .select("id, current_price, tcg_id")
      .not("current_price", "is", null)
      .gt("current_price", 0)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error("Failed to fetch cards:", error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    cards.push(...(data as typeof cards));
    page++;
    console.log(`Fetched ${cards.length} cards...`);
  }

  console.log(`Generating 90-day history for ${cards.length} cards...`);

  let totalInserted = 0;
  const BATCH_SIZE = 500;
  let batch: Array<{
    card_id: string;
    source: string;
    price: number;
    condition: string;
    recorded_at: string;
  }> = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const history = generateHistory(Number(card.current_price), 90);

    for (const point of history) {
      batch.push({
        card_id: card.id,
        source: card.tcg_id === "pokemon" ? "tcgplayer" : "tcgplayer",
        price: point.price,
        condition: "Near Mint",
        recorded_at: point.date,
      });
    }

    // Flush batch
    if (batch.length >= BATCH_SIZE) {
      const { error: insertError } = await supabase.from("prices").insert(batch);
      if (insertError) {
        console.error(`Insert error at card ${i}:`, insertError.message);
      }
      totalInserted += batch.length;
      batch = [];

      if ((i + 1) % 500 === 0) {
        console.log(`Progress: ${i + 1}/${cards.length} cards (${totalInserted} price points)`);
      }
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await supabase.from("prices").insert(batch);
    totalInserted += batch.length;
  }

  console.log(`\nDone! Generated ${totalInserted} price points for ${cards.length} cards`);
  console.log(`Average: ${Math.round(totalInserted / cards.length)} points per card`);
}

main().catch(console.error);
