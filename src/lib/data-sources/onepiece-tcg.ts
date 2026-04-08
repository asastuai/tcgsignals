/**
 * One Piece TCG data source
 *
 * Official site: https://en.onepiece-cardgame.com
 * Card images: https://en.onepiece-cardgame.com/images/cardlist/card/{CARD_ID}.png
 *
 * No official API exists. Data options:
 * 1. Scrape card list pages from official site
 * 2. Use community APIs (onepiece-cardgame API on GitHub)
 * 3. Manual seed from known set lists
 *
 * For now we use the official card list page which has structured data.
 */

interface OnePieceCard {
  id: string;        // 'OP09-119'
  name: string;
  set_id: string;    // 'OP-09'
  set_name: string;
  rarity: string;    // 'L', 'SEC', 'SR', 'R', 'UC', 'C'
  color: string;     // 'Red', 'Blue', etc.
  card_type: string; // 'Leader', 'Character', 'Event', 'Stage'
  cost?: string;
  power?: string;
  counter?: string;
  attribute?: string;
  image_url: string;
}

// Known One Piece TCG sets (manually maintained until API is available)
export const ONEPIECE_SETS = [
  { id: "OP-09", name: "The Four Emperors", release_date: "2024-12-06", code: "OP-09" },
  { id: "OP-08", name: "Two Legends", release_date: "2024-08-30", code: "OP-08" },
  { id: "OP-07", name: "500 Years in the Future", release_date: "2024-06-28", code: "OP-07" },
  { id: "OP-06", name: "Wings of the Captain", release_date: "2024-03-15", code: "OP-06" },
  { id: "OP-05", name: "Awakening of the New Era", release_date: "2023-12-08", code: "OP-05" },
  { id: "OP-04", name: "Kingdoms of Intrigue", release_date: "2023-09-22", code: "OP-04" },
  { id: "OP-03", name: "Pillars of Strength", release_date: "2023-06-30", code: "OP-03" },
  { id: "OP-02", name: "Paramount War", release_date: "2023-03-10", code: "OP-02" },
  { id: "OP-01", name: "Romance Dawn", release_date: "2022-12-02", code: "OP-01" },
  { id: "EB-01", name: "Extra Booster: Memorial Collection", release_date: "2024-01-26", code: "EB-01" },
  { id: "ST-01", name: "Straw Hat Crew", release_date: "2022-12-02", code: "ST-01" },
  { id: "ST-10", name: "The Three Captains", release_date: "2023-11-17", code: "ST-10" },
];

export function mapOnePieceSetToDB(set: typeof ONEPIECE_SETS[0]) {
  return {
    id: set.id,
    tcg_id: "onepiece" as const,
    name: set.name,
    slug: set.id.toLowerCase(),
    code: set.code,
    release_date: set.release_date,
    card_count: 0,
    image_url: null,
    series: "One Piece",
  };
}

export function getOnePieceImageUrl(cardId: string): string {
  return `https://www.optcgapi.com/media/static/Card_Images/${cardId}.jpg`;
}

export function mapOnePieceCardToDB(card: OnePieceCard) {
  return {
    id: `op-${card.id.toLowerCase()}`,
    tcg_id: "onepiece" as const,
    set_id: card.set_id,
    name: card.name,
    number: card.id,
    rarity: card.rarity,
    supertype: card.card_type,
    subtypes: card.color ? [card.color] : [],
    types: card.color ? [card.color] : [],
    image_small: card.image_url,
    image_large: card.image_url,
    artist: null,
    flavor_text: null,
    hp: card.power || null,
    tcg_external_id: card.id,
    tcgplayer_url: null,
    cardmarket_url: null,
  };
}

/**
 * Scrape One Piece card list from official site
 * The card list page renders cards with their IDs which we can use to construct image URLs
 */
export async function fetchOnePieceCards(setCode: string): Promise<OnePieceCard[]> {
  // The official site card list: https://en.onepiece-cardgame.com/cardlist/
  // We need to fetch the card list page and parse the card data
  // For now, this is a placeholder that will be implemented with proper scraping

  // Generate known card IDs for the set based on typical set structure
  // OP sets typically have: Leaders (001), Characters, Events, Stages, then SEC/SP at end
  const cards: OnePieceCard[] = [];

  // This will be replaced with actual scraping
  // For now we'll use the seed-onepiece API endpoint with manual data

  return cards;
}
