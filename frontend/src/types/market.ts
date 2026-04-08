// Mirrors python-src/markets/poly_markets.json entries
export interface PolymarketMarket {
  title: string;
  id: string;
  slug: string;
  description: string;
  end_date: string;
  category: string;
  liquidity: string;
  fee: number | null;
  outcomePrices: string; // JSON string: '["0.55", "0.45"]'
  volumeNum: number;
  clob_token_ids: [string, string]; // [YES_token, NO_token]
}

// Mirrors python-src/markets/kalshi_markets.json entries
export interface KalshiMarket {
  title: string;
  ticker: string;
  event_ticker: string;
  subtitle: string;
  rules: string;
  close_time: string;
  status: string;
  volume_fp: string;
  rules_primary: string;
  rules_secondary: string;
  yes_ask_dollars: string;
  no_ask_dollars: string;
}

// Mirrors python-src/matches/embed_matches.json entries
export interface MatchPair {
  score: number; // Cosine similarity 0-1
  polymarket: PolymarketMarket;
  kalshi: KalshiMarket;
}

export interface ThresholdGroup {
  threshold: number;
  count: number;
  matches: MatchPair[];
}

// Mirrors python-src/prices/live_prices.json entries
export interface PriceData {
  yes_ask: number;
  no_ask: number | null;
  timestamp: string;
}

export interface LivePrices {
  [key: string]: PriceData; // "poly::{title}" or "kalshi::{ticker}"
}

// Computed arbitrage opportunity (frontend-derived)
export interface ArbitrageOpportunity {
  id: string;
  matchScore: number;
  polymarket: PolymarketMarket;
  kalshi: KalshiMarket;
  polyPrice: PriceData | null;
  kalshiPrice: PriceData | null;
  spread: number; // Percentage spread
  direction: "poly_yes_kalshi_no" | "kalshi_yes_poly_no" | "none";
  profit: number; // Estimated profit per $1
  lastUpdated: string;
}

// System status
export interface SystemStatus {
  vpsUptime: "online" | "degraded" | "offline";
  kalshiSocket: "connected" | "reconnecting" | "disconnected";
  polySocket: "connected" | "reconnecting" | "disconnected";
  aiEngine: "active" | "processing" | "idle";
}

// Historical price point for charts
export interface PricePoint {
  timestamp: number;
  polyYes: number;
  kalshiYes: number;
  spread: number;
}
