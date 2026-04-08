import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function generateSparkline(
  basePrice: number,
  points: number = 20,
  direction?: "up" | "down"
): number[] {
  const data: number[] = [];
  let price = basePrice * (0.85 + Math.random() * 0.2);
  const trend = direction === "up" ? 0.005 : direction === "down" ? -0.005 : (Math.random() - 0.45) * 0.008;

  for (let i = 0; i < points; i++) {
    const noise = (Math.random() - 0.5) * basePrice * 0.04;
    price = Math.max(price + noise + basePrice * trend, basePrice * 0.3);
    if (i === points - 1) price = basePrice;
    data.push(parseFloat(price.toFixed(2)));
  }

  return data;
}
