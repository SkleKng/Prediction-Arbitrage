"use client";

import { motion } from "framer-motion";
import { TrendingUp, Activity, Zap } from "lucide-react";
import type { ArbitrageOpportunity } from "@/types/market";

interface DashboardHeroProps {
  opportunities: ArbitrageOpportunity[];
}

export function DashboardHero({ opportunities }: DashboardHeroProps) {
  const bestSpread = opportunities.length > 0 ? opportunities[0] : null;
  const profitableCount = opportunities.filter((o) => o.spread > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-obsidian-light border border-white/10 rounded-sm overflow-hidden p-6"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <motion.div
          className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, 15, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-neon-green/60" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
              System Overview
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white/90 mb-1 tracking-tight">
            {profitableCount} PROFITABLE ARBITRAGE
            {profitableCount !== 1 ? " OPPORTUNITIES" : " OPPORTUNITY"} DETECTED
          </h2>
          <p className="text-sm text-white/40 max-w-lg">
            AI engine is actively monitoring cross-platform spreads between
            Polymarket and Kalshi prediction markets in real-time.
          </p>
        </div>

        {/* Best spread highlight */}
        {bestSpread && bestSpread.spread > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="shrink-0 text-right"
          >
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/25 block mb-1">
              Best Spread
            </span>
            <div className="flex items-center gap-2 justify-end">
              <TrendingUp className="w-5 h-5 text-neon-green" />
              <span className="text-3xl font-mono font-bold text-neon-green tabular-nums">
                {bestSpread.spread.toFixed(2)}%
              </span>
            </div>
            <p className="text-[11px] text-white/30 font-mono mt-1 max-w-[200px] text-right truncate">
              {bestSpread.polymarket.title}
            </p>
          </motion.div>
        )}
      </div>

      {/* Animated scanning bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.5), transparent)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}
