"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ArbitrageOpportunity,
  LivePrices,
  MatchPair,
  SystemStatus,
} from "@/types/market";
import {
  computeArbitrageOpportunities,
  MOCK_SYSTEM_STATUS,
  MOCK_TOTAL_CAPITAL,
  MOCK_24HR_PNL,
  MOCK_ACTIVE_POSITIONS,
  MOCK_TOTAL_MATCHES,
  MOCK_MATCHES,
  MOCK_LIVE_PRICES,
} from "@/data/mock";

interface ArbitrageDataState {
  opportunities: ArbitrageOpportunity[];
  systemStatus: SystemStatus;
  totalCapital: number;
  pnl24hr: number;
  activePositions: number;
  totalMatches: number;
  matches: MatchPair[];
  livePrices: LivePrices;
  isConnected: boolean;
}

const PRICE_POLL_MS = 3000;
const MATCHES_REFRESH_MS = 60_000;
// Track up to this many recent socket reads to decide if WS is "live".
// Any successful /api/prices fetch resets the counter.
const STALE_THRESHOLD_MS = 15_000;

/**
 * Live arbitrage data hook.
 *
 * Data flow:
 *  - /api/matches      → AI-confirmed (Polymarket × Kalshi) pairs from
 *                        python-src/matches/ai_matches.json joined with the
 *                        rich market metadata in embed_matches.json.
 *  - /api/prices       → Latest order-book prices written every tick by
 *                        python-src/ws_price_monitoring.py to
 *                        prices/live_prices.json.
 *  - /api/opportunities (optional) → Append-only history of arbs the
 *                        Python detector has fired on (used for the
 *                        "active positions" / alert counters).
 *
 * Opportunities are computed client-side on each price tick by
 * cross-referencing the two streams. We deliberately filter out matches
 * with no live data so the feed isn't padded with 200+ empty cards.
 */
export function useArbitrageData(): ArbitrageDataState {
  const [state, setState] = useState<ArbitrageDataState>(() => ({
    opportunities: computeArbitrageOpportunities(),
    systemStatus: MOCK_SYSTEM_STATUS,
    totalCapital: MOCK_TOTAL_CAPITAL,
    pnl24hr: MOCK_24HR_PNL,
    activePositions: MOCK_ACTIVE_POSITIONS,
    totalMatches: MOCK_TOTAL_MATCHES,
    matches: MOCK_MATCHES,
    livePrices: MOCK_LIVE_PRICES,
    isConnected: false,
  }));

  // Holds the most recent confirmed matches list so price ticks can
  // recompute opportunities without re-fetching matches every 3s.
  const matchesRef = useRef<MatchPair[]>(MOCK_MATCHES);
  const lastPriceTickRef = useRef<number>(0);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches");
      if (!res.ok) return;
      const data = (await res.json()) as {
        matches: MatchPair[];
        confirmedCount: number;
        totalAiPairs: number;
      };

      if (!Array.isArray(data.matches) || data.matches.length === 0) return;

      matchesRef.current = data.matches;
      setState((prev) => ({
        ...prev,
        matches: data.matches,
        totalMatches: data.totalAiPairs || data.confirmedCount,
        // Recompute with whatever prices we already have.
        opportunities: filterUseful(
          computeArbitrageOpportunities(data.matches, prev.livePrices)
        ),
      }));
    } catch (err) {
      console.warn("Failed to fetch matches", err);
    }
  }, []);

  const fetchLivePrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) return;
      const liveData = (await res.json()) as LivePrices;

      lastPriceTickRef.current = Date.now();

      setState((prev) => {
        // Merge with mock prices as a fallback so demo markets keep showing
        // numbers even when the WS only knows about a subset of them.
        const mergedPrices: LivePrices = { ...MOCK_LIVE_PRICES, ...liveData };

        const opportunities = filterUseful(
          computeArbitrageOpportunities(matchesRef.current, mergedPrices)
        );

        const isFresh = Date.now() - lastPriceTickRef.current < STALE_THRESHOLD_MS;
        const profitableCount = opportunities.filter((o) => o.spread > 0).length;

        return {
          ...prev,
          livePrices: mergedPrices,
          opportunities,
          isConnected: isFresh,
          activePositions: profitableCount,
          systemStatus: {
            ...prev.systemStatus,
            polySocket: isFresh ? "connected" : "reconnecting",
            kalshiSocket: isFresh ? "connected" : "reconnecting",
            aiEngine: matchesRef.current.length > 0 ? "active" : "idle",
          },
        };
      });
    } catch (err) {
      console.warn("Failed to fetch live prices", err);
      setState((prev) => ({ ...prev, isConnected: false }));
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    fetchLivePrices();

    const priceTimer = setInterval(fetchLivePrices, PRICE_POLL_MS);
    const matchesTimer = setInterval(fetchMatches, MATCHES_REFRESH_MS);

    return () => {
      clearInterval(priceTimer);
      clearInterval(matchesTimer);
    };
  }, [fetchLivePrices, fetchMatches]);

  return state;
}

/**
 * Drop opportunities where neither side has any live price data — they're
 * just stale matches and would clutter the feed. We keep cards that have at
 * least one side priced, since that's still meaningful market context.
 */
function filterUseful(opps: ArbitrageOpportunity[]): ArbitrageOpportunity[] {
  return opps.filter((o) => {
    const hasPoly = o.polyPrice && (o.polyPrice.yes_ask > 0 || (o.polyPrice.no_ask ?? 0) > 0);
    const hasKalshi = o.kalshiPrice && o.kalshiPrice.yes_ask > 0;
    return hasPoly || hasKalshi;
  });
}
