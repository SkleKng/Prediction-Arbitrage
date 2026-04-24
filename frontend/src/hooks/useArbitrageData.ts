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

/**
 * Hook to manage arbitrage data.
 * Currently uses mock data. When ready, swap in WebSocket connections
 * to python-src/ws_price_monitoring.py and load matches from
 * python-src/matches/embed_matches.json via an API route.
 *
 * WebSocket integration points:
 * - Polymarket: wss://ws-subscriptions-clob.polymarket.com/ws/market
 *   Subscribe with: { type: "market", assets_ids: [...clob_token_ids] }
 *   Listen for: event_type === "best_bid_ask"
 *
 * - Kalshi: wss://api.elections.kalshi.com/trade-api/ws/v2
 *   Requires KALSHI-ACCESS-KEY + PSS-signed timestamp headers
 *   Subscribe with: { cmd: "subscribe", params: { channels: ["ticker"], market_tickers: [...] } }
 *   Listen for: type === "ticker"
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
    isConnected: true,
  }));

  // Simulate price ticks for demo purposes
  const tickRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Fetch live prices from the Python backend output
  const fetchLivePrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) return;
      const liveData = await res.json();

      setState((prev) => {
        // Recompute PnL with slight drift (for demo purposes)
        const pnlDrift = (Math.random() - 0.45) * 15;
        
        // Ensure we merge with the initial mock prices as a fallback so we don't get 0s for missing markets
        const mergedPrices = { ...MOCK_LIVE_PRICES, ...liveData };

        return {
          ...prev,
          livePrices: mergedPrices,
          opportunities: computeArbitrageOpportunities(mergedPrices),
          pnl24hr: prev.pnl24hr + pnlDrift,
        };
      });
    } catch (err) {
      // Use console.warn instead of console.error to prevent the Next.js error overlay
      // from popping up during transient network errors or dev server restarts
      console.warn("Failed to fetch live prices (transient network error)", err);
    }
  }, []);

  useEffect(() => {
    // Poll the API every 3 seconds to get the latest prices from the Python script
    tickRef.current = setInterval(fetchLivePrices, 3000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [fetchLivePrices]);

  return state;
}
