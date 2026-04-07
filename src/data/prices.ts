import { PriceHistory, PlatformPrice } from "@/lib/types";

function generatePriceHistory(
  basePrice: number,
  days: number,
  volatility: number = 0.05
): PriceHistory["prices"] {
  const prices: PriceHistory["prices"] = [];
  let price = basePrice * (1 - volatility * days * 0.01);

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.45) * basePrice * volatility;
    price = Math.max(price + change, basePrice * 0.3);
    prices.push({
      date: date.toISOString().split("T")[0],
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 50 + 5),
    });
  }

  return prices;
}

const priceHistoryCache: Record<string, PriceHistory> = {};

export function getPriceHistory(cardId: string, basePrice: number): PriceHistory {
  if (!priceHistoryCache[cardId]) {
    priceHistoryCache[cardId] = {
      cardId,
      prices: generatePriceHistory(basePrice, 90),
    };
  }
  return priceHistoryCache[cardId];
}

export function getPlatformPrices(cardId: string, basePrice: number): PlatformPrice[] {
  const variance = () => basePrice * (0.95 + Math.random() * 0.1);
  return [
    {
      platform: "TCGPlayer",
      price: parseFloat(variance().toFixed(2)),
      url: "#",
      condition: "Near Mint",
      lastUpdated: new Date().toISOString(),
    },
    {
      platform: "CardMarket",
      price: parseFloat(variance().toFixed(2)),
      url: "#",
      condition: "Near Mint",
      lastUpdated: new Date().toISOString(),
    },
    {
      platform: "eBay",
      price: parseFloat(variance().toFixed(2)),
      url: "#",
      condition: "Near Mint",
      lastUpdated: new Date().toISOString(),
    },
  ];
}
