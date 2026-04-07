import { Card } from "@/lib/types";

function generatePriceChange() {
  return parseFloat((Math.random() * 20 - 10).toFixed(2));
}

export const cards: Card[] = [
  // Pokemon cards
  {
    id: "pkmn-sv4pt5-234",
    name: "Charizard ex",
    tcg: "pokemon",
    set: "sv4pt5",
    setName: "Paldean Fates",
    number: "234/091",
    rarity: "Special Illustration Rare",
    image: "https://images.pokemontcg.io/sv4pt5/234_hires.png",
    currentPrice: 89.99,
    previousPrice: 82.50,
    priceChange24h: 9.08,
    lastSold: {
      price: 87.50,
      platform: "TCGPlayer",
      date: "2026-04-06T14:30:00Z",
      condition: "Near Mint",
    },
  },
  {
    id: "pkmn-sv8-238",
    name: "Pikachu ex",
    tcg: "pokemon",
    set: "sv8",
    setName: "Surging Sparks",
    number: "238/252",
    rarity: "Special Illustration Rare",
    image: "https://images.pokemontcg.io/sv8/238_hires.png",
    currentPrice: 42.00,
    previousPrice: 45.00,
    priceChange24h: -6.67,
    lastSold: {
      price: 41.50,
      platform: "eBay",
      date: "2026-04-06T12:15:00Z",
      condition: "Near Mint",
    },
  },
  {
    id: "pkmn-sv8pt5-161",
    name: "Umbreon ex",
    tcg: "pokemon",
    set: "sv8pt5",
    setName: "Prismatic Evolutions",
    number: "161/091",
    rarity: "Special Illustration Rare",
    image: "https://images.pokemontcg.io/sv8pt5/161_hires.png",
    currentPrice: 156.00,
    previousPrice: 148.00,
    priceChange24h: 5.41,
    lastSold: {
      price: 152.00,
      platform: "CardMarket",
      date: "2026-04-06T10:00:00Z",
      condition: "Mint",
    },
  },
  {
    id: "pkmn-sv10-231",
    name: "Mewtwo ex",
    tcg: "pokemon",
    set: "sv10",
    setName: "Destined Rivals",
    number: "231/185",
    rarity: "Special Illustration Rare",
    image: "https://images.pokemontcg.io/sv10/231_hires.png",
    currentPrice: 67.50,
    previousPrice: 71.00,
    priceChange24h: -4.93,
    lastSold: {
      price: 66.00,
      platform: "TCGPlayer",
      date: "2026-04-05T22:45:00Z",
      condition: "Near Mint",
    },
  },
  {
    id: "pkmn-sv6-188",
    name: "Eevee",
    tcg: "pokemon",
    set: "sv6",
    setName: "Twilight Masquerade",
    number: "188/167",
    rarity: "Illustration Rare",
    image: "https://images.pokemontcg.io/sv6/188_hires.png",
    currentPrice: 12.50,
    previousPrice: 11.80,
    priceChange24h: 5.93,
    lastSold: {
      price: 12.00,
      platform: "eBay",
      date: "2026-04-06T09:20:00Z",
      condition: "Near Mint",
    },
  },
  {
    id: "pkmn-bb-sv08",
    name: "Surging Sparks Booster Box",
    tcg: "pokemon",
    set: "sv08",
    setName: "Surging Sparks",
    number: "BB",
    rarity: "Sealed Product",
    image: "https://images.pokemontcg.io/sv8/en_US/sv8_logo.png",
    currentPrice: 142.99,
    previousPrice: 139.99,
    priceChange24h: 2.14,
    lastSold: {
      price: 141.00,
      platform: "TCGPlayer",
      date: "2026-04-06T16:00:00Z",
      condition: "Sealed",
    },
  },

  // One Piece cards
  {
    id: "op-eb02-001",
    name: "Monkey D. Luffy (Gear 5)",
    tcg: "onepiece",
    set: "EB-02",
    setName: "Extra Booster: Memorial Collection",
    number: "EB02-001",
    rarity: "SEC",
    image: "https://en.onepiece-cardgame.com/images/cardlist/card/OP09-119.png",
    currentPrice: 245.00,
    previousPrice: 220.00,
    priceChange24h: 11.36,
    lastSold: {
      price: 240.00,
      platform: "TCGPlayer",
      date: "2026-04-06T15:30:00Z",
      condition: "Near Mint",
    },
  },
  {
    id: "op-op09-001",
    name: "Roronoa Zoro (Alternate Art)",
    tcg: "onepiece",
    set: "OP-09",
    setName: "The Four Emperors",
    number: "OP09-119",
    rarity: "SEC",
    image: "https://en.onepiece-cardgame.com/images/cardlist/card/OP09-071.png",
    currentPrice: 178.00,
    previousPrice: 185.00,
    priceChange24h: -3.78,
    lastSold: {
      price: 175.00,
      platform: "CardMarket",
      date: "2026-04-06T11:20:00Z",
      condition: "Near Mint",
    },
  },
  {
    id: "op-op09-002",
    name: "Shanks (Manga Art)",
    tcg: "onepiece",
    set: "OP-09",
    setName: "The Four Emperors",
    number: "OP09-120",
    rarity: "SEC",
    image: "https://en.onepiece-cardgame.com/images/cardlist/card/OP09-118.png",
    currentPrice: 320.00,
    previousPrice: 295.00,
    priceChange24h: 8.47,
    lastSold: {
      price: 315.00,
      platform: "eBay",
      date: "2026-04-06T13:45:00Z",
      condition: "Mint",
    },
  },
  {
    id: "op-op08-001",
    name: "Nami (Alternate Art)",
    tcg: "onepiece",
    set: "OP-08",
    setName: "Two Legends",
    number: "OP08-106",
    rarity: "SR",
    image: "https://en.onepiece-cardgame.com/images/cardlist/card/OP08-106.png",
    currentPrice: 95.00,
    previousPrice: 88.00,
    priceChange24h: 7.95,
    lastSold: {
      price: 92.00,
      platform: "TCGPlayer",
      date: "2026-04-06T08:10:00Z",
      condition: "Near Mint",
    },
  },
  {
    id: "op-bb-op09",
    name: "The Four Emperors Booster Box",
    tcg: "onepiece",
    set: "OP-09",
    setName: "The Four Emperors",
    number: "BB",
    rarity: "Sealed Product",
    image: "https://en.onepiece-cardgame.com/images/cardlist/card/OP09-001.png",
    currentPrice: 115.00,
    previousPrice: 108.00,
    priceChange24h: 6.48,
    lastSold: {
      price: 112.00,
      platform: "eBay",
      date: "2026-04-06T14:00:00Z",
      condition: "Sealed",
    },
  },
  {
    id: "op-op07-001",
    name: "Portgas D. Ace (Alternate Art)",
    tcg: "onepiece",
    set: "OP-07",
    setName: "500 Years in the Future",
    number: "OP07-119",
    rarity: "SEC",
    image: "https://en.onepiece-cardgame.com/images/cardlist/card/OP07-119.png",
    currentPrice: 135.00,
    previousPrice: 140.00,
    priceChange24h: -3.57,
    lastSold: {
      price: 132.00,
      platform: "CardMarket",
      date: "2026-04-05T20:30:00Z",
      condition: "Near Mint",
    },
  },
];

export function getCardsByTcg(tcg: string): Card[] {
  return cards.filter((c) => c.tcg === tcg);
}

export function getCardById(id: string): Card | undefined {
  return cards.find((c) => c.id === id);
}

export function searchCards(query: string): Card[] {
  const q = query.toLowerCase();
  return cards.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.setName.toLowerCase().includes(q) ||
      c.rarity.toLowerCase().includes(q)
  );
}

export function getTrendingCards(): Card[] {
  return [...cards].sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h)).slice(0, 6);
}

export function getTopGainers(): Card[] {
  return [...cards].sort((a, b) => b.priceChange24h - a.priceChange24h).slice(0, 5);
}

export function getTopLosers(): Card[] {
  return [...cards].sort((a, b) => a.priceChange24h - b.priceChange24h).slice(0, 5);
}
