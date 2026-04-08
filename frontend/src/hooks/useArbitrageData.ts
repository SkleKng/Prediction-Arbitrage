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

  const simulateTick = useCallback(() => {
    setState((prev) => {
      const newPrices = { ...prev.livePrices };
      const keys = Object.keys(newPrices);

      // Randomly update 2-3 prices
      for (let i = 0; i < 3; i++) {
        const key = keys[Math.floor(Math.random() * keys.length)];
        if (newPrices[key]) {
          const drift = (Math.random() - 0.5) * 0.01;
          const newYes = Math.max(
            0.001,
            Math.min(0.999, newPrices[key].yes_ask + drift)
          );
          newPrices[key] = {
            ...newPrices[key],
            yes_ask: parseFloat(newYes.toFixed(4)),
            no_ask: parseFloat((1 - newYes).toFixed(4)),
            timestamp: Date.now().toString(),
          };
        }
      }

      // Recompute PnL with slight drift
      const pnlDrift = (Math.random() - 0.45) * 15;

      return {
        ...prev,
        livePrices: newPrices,
        pnl24hr: prev.pnl24hr + pnlDrift,
        // In production, recompute opportunities from new prices
        // For now, keep existing opportunities
      };
    });
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(simulateTick, 3000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [simulateTick]);

  return state;
}
