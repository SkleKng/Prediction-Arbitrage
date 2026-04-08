"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ExternalLink,
  Brain,
} from "lucide-react";
import { cn, formatVolume } from "@/lib/utils";
import type { ArbitrageOpportunity } from "@/types/market";
import { SpreadChart } from "./SpreadChart";
import { generatePriceHistory } from "@/data/mock";

interface ArbitrageCardProps {
  opportunity: ArbitrageOpportunity;
  index: number;
}

export function ArbitrageCard({ opportunity, index }: ArbitrageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isProfit = opportunity.spread > 0;
  const isHotSpread = opportunity.spread >= 2;

  const polyYes = opportunity.polyPrice?.yes_ask ?? 0;
  const kalshiYes = opportunity.kalshiPrice?.yes_ask ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "glass glass-hover rounded-xl overflow-hidden transition-all duration-300 cursor-pointer",
        isHotSpread && "glow-green border-neon-green/20"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Main row */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left - Market info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider",
                  isProfit
                    ? "bg-neon-green/10 text-neon-green"
                    : "bg-neon-red/10 text-neon-red"
                )}
              >
                {isProfit ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {opportunity.spread.toFixed(2)}% spread
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-neon-purple/10 text-neon-purple">
                <Brain className="w-3 h-3" />
                {(opportunity.matchScore * 100).toFixed(1)}% match
              </span>
            </div>

            {/* Market titles */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-neon-blue uppercase tracking-wider shrink-0">
                    POLY
                  </span>
                  <p className="text-sm text-white/90 truncate">
                    {opportunity.polymarket.title}
                  </p>
                </div>
              </div>
              <div className="text-white/20 shrink-0">
                <svg width="20" height="12" viewBox="0 0 20 12">
                  <path
                    d="M0 6h16M12 1l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-neon-yellow uppercase tracking-wider shrink-0">
                    KALSHI
                  </span>
                  <p className="text-sm text-white/90 truncate">
                    {opportunity.kalshi.title}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Prices */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Poly price */}
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-white/30 block">
                Poly YES
              </span>
              <span className="text-lg font-mono font-semibold text-neon-blue tabular-nums">
                {polyYes.toFixed(3)}
              </span>
            </div>

            {/* Kalshi price */}
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-white/30 block">
                Kalshi YES
              </span>
              <span className="text-lg font-mono font-semibold text-neon-yellow tabular-nums">
                {kalshiYes.toFixed(3)}
              </span>
            </div>

            {/* Spread */}
            <div className="text-right min-w-[80px]">
              <span className="text-[9px] uppercase tracking-wider text-white/30 block">
                Profit/$1
              </span>
              <span
                className={cn(
                  "text-lg font-mono font-bold tabular-nums",
                  isProfit ? "text-neon-green" : "text-neon-red"
                )}
              >
                {isProfit ? "+" : ""}
                ${opportunity.profit.toFixed(4)}
              </span>
            </div>

            {/* Expand chevron */}
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/30"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </div>

        {/* Volume bar */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
            <span>Vol:</span>
            <span className="text-white/60">
              {formatVolume(opportunity.polymarket.volumeNum)}
            </span>
            <span className="text-white/20">|</span>
            <span className="text-white/60">
              {formatVolume(parseFloat(opportunity.kalshi.volume_fp))}
            </span>
          </div>
          <div className="flex-1" />
          <div className="text-[10px] font-mono text-white/30">
            {opportunity.kalshi.ticker}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://polymarket.com/event/${opportunity.polymarket.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-white/20 hover:text-neon-blue transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Expanded chart area */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="border-t border-white/5"
        >
          <ExpandedContent opportunity={opportunity} />
        </motion.div>
      )}
    </motion.div>
  );
}

function ExpandedContent({
  opportunity,
}: {
  opportunity: ArbitrageOpportunity;
}) {
  const polyYes = opportunity.polyPrice?.yes_ask ?? 0;
  const kalshiYes = opportunity.kalshiPrice?.yes_ask ?? 0;
  const history = generatePriceHistory(polyYes, kalshiYes);

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-3">
            Price Convergence (24h)
          </h3>
          <SpreadChart data={history} />
        </div>

        {/* Details panel */}
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40">
            Market Details
          </h3>

          <div className="space-y-3">
            <DetailRow label="Direction" value={
              opportunity.direction === "poly_yes_kalshi_no"
                ? "Buy Poly YES + Kalshi NO"
                : opportunity.direction === "kalshi_yes_poly_no"
                  ? "Buy Kalshi YES + Poly NO"
                  : "No arbitrage"
            } />
            <DetailRow label="Poly Liquidity" value={`$${parseFloat(opportunity.polymarket.liquidity).toLocaleString()}`} />
            <DetailRow label="Kalshi Volume" value={`$${parseFloat(opportunity.kalshi.volume_fp).toLocaleString()}`} />
            <DetailRow label="Poly End" value={new Date(opportunity.polymarket.end_date).toLocaleDateString()} />
            <DetailRow label="Kalshi Close" value={new Date(opportunity.kalshi.close_time).toLocaleDateString()} />
            <DetailRow label="AI Score" value={`${(opportunity.matchScore * 100).toFixed(1)}%`} highlight />
          </div>

          {/* Action hint */}
          <div className={cn(
            "rounded-lg p-3 text-center text-xs font-mono",
            opportunity.spread >= 2
              ? "bg-neon-green/5 border border-neon-green/20 text-neon-green"
              : "bg-white/5 border border-white/10 text-white/40"
          )}>
            {opportunity.spread >= 2
              ? "ACTIONABLE SPREAD DETECTED"
              : "Monitoring spread convergence..."}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-white/40">{label}</span>
      <span
        className={cn(
          "text-[11px] font-mono tabular-nums",
          highlight ? "text-neon-purple" : "text-white/70"
        )}
      >
        {value}
      </span>
    </div>
  );
}
