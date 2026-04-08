import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function getSpreadColor(spread: number): string {
  if (spread >= 5) return "text-green-400";
  if (spread >= 2) return "text-emerald-400";
  if (spread >= 0) return "text-yellow-400";
  return "text-red-400";
}

export function getSpreadGlow(spread: number): string {
  if (spread >= 2) return "shadow-[0_0_15px_rgba(74,222,128,0.3)]";
  return "";
}

export function parsePolyPrices(outcomePrices: string): [number, number] {
  try {
    const prices = JSON.parse(outcomePrices) as string[];
    return [parseFloat(prices[0]), parseFloat(prices[1])];
  } catch {
    return [0, 0];
  }
}

export function calculateSpread(
  polyYes: number,
  kalshiYes: number
): { spread: number; direction: "poly_yes_kalshi_no" | "kalshi_yes_poly_no" | "none" } {
  // Arbitrage: buy YES on one, buy NO (1 - YES) on other
  // Profit = 1 - (polyYes + kalshiNo) or 1 - (kalshiYes + polyNo)
  const costPolyYesKalshiNo = polyYes + (1 - kalshiYes);
  const costKalshiYesPolyNo = kalshiYes + (1 - polyYes);

  const profitA = (1 - costPolyYesKalshiNo) * 100;
  const profitB = (1 - costKalshiYesPolyNo) * 100;

  if (profitA > profitB && profitA > 0) {
    return { spread: profitA, direction: "poly_yes_kalshi_no" };
  }
  if (profitB > 0) {
    return { spread: profitB, direction: "kalshi_yes_poly_no" };
  }
  return { spread: Math.max(profitA, profitB), direction: "none" };
}
