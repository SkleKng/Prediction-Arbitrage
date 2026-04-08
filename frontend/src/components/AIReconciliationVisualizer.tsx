"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchPair } from "@/types/market";

interface AIReconciliationVisualizerProps {
  matches: MatchPair[];
}

export function AIReconciliationVisualizer({
  matches,
}: AIReconciliationVisualizerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const match = matches[activeIndex];
  if (!match) return null;

  const confidencePercent = (match.score * 100).toFixed(1);
  const isHighConfidence = match.score >= 0.95;

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-neon-purple" />
          <h2 className="text-sm font-semibold text-white/90">
            AI Reconciliation
          </h2>
          <span className="text-[10px] font-mono text-white/30">
            Embedding Similarity Visualizer
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/30">
            {activeIndex + 1} / {matches.length}
          </span>
          <button
            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </button>
          <button
            onClick={() =>
              setActiveIndex(Math.min(matches.length - 1, activeIndex + 1))
            }
            disabled={activeIndex === matches.length - 1}
            className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>

      {/* Split pane */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-[1fr_auto_1fr] gap-0"
        >
          {/* Polymarket side */}
          <div className="p-5 border-r border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-neon-blue" />
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-neon-blue">
                Polymarket
              </span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              {match.polymarket.title}
            </p>
            <div className="mt-3 space-y-1.5">
              <MetaLine label="ID" value={match.polymarket.id} />
              <MetaLine label="End" value={new Date(match.polymarket.end_date).toLocaleDateString()} />
              <MetaLine label="Volume" value={`$${match.polymarket.volumeNum.toLocaleString()}`} />
              <MetaLine label="Liquidity" value={`$${parseFloat(match.polymarket.liquidity).toLocaleString()}`} />
            </div>
          </div>

          {/* Center - AI confidence */}
          <div className="flex flex-col items-center justify-center px-6 py-5 min-w-[140px]">
            {/* Confidence score */}
            <motion.div
              className={cn(
                "relative w-20 h-20 rounded-full flex items-center justify-center",
                isHighConfidence
                  ? "border-2 border-neon-green/30"
                  : "border-2 border-neon-purple/30"
              )}
            >
              {/* Pulsing ring */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-full",
                  isHighConfidence
                    ? "border-2 border-neon-green/20"
                    : "border-2 border-neon-purple/20"
                )}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <div className="text-center">
                <motion.span
                  key={confidencePercent}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "text-lg font-mono font-bold block",
                    isHighConfidence ? "text-neon-green" : "text-neon-purple"
                  )}
                >
                  {confidencePercent}%
                </motion.span>
                <span className="text-[8px] uppercase tracking-wider text-white/30">
                  Match
                </span>
              </div>
            </motion.div>

            {/* Connecting lines */}
            <div className="flex items-center gap-1 my-3">
              <motion.div
                className="h-px w-6 bg-gradient-to-r from-neon-blue/50 to-transparent"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <Sparkles className="w-3 h-3 text-neon-purple/50" />
              <motion.div
                className="h-px w-6 bg-gradient-to-l from-neon-yellow/50 to-transparent"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </div>

            <span className="text-[9px] font-mono text-white/20 uppercase tracking-wider">
              all-mpnet-base-v2
            </span>
          </div>

          {/* Kalshi side */}
          <div className="p-5 border-l border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-neon-yellow" />
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-neon-yellow">
                Kalshi
              </span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              {match.kalshi.title}
            </p>
            <div className="mt-3 space-y-1.5">
              <MetaLine label="Ticker" value={match.kalshi.ticker} />
              <MetaLine label="Close" value={new Date(match.kalshi.close_time).toLocaleDateString()} />
              <MetaLine label="Volume" value={`$${parseFloat(match.kalshi.volume_fp).toLocaleString()}`} />
              <MetaLine label="YES/NO" value={`${match.kalshi.yes_ask_dollars} / ${match.kalshi.no_ask_dollars}`} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Rules comparison */}
      <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01]">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-white/20 block mb-1">
              Poly Description (truncated)
            </span>
            <p className="text-[11px] text-white/30 line-clamp-2">
              {match.polymarket.description}
            </p>
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-white/20 block mb-1">
              Kalshi Rules
            </span>
            <p className="text-[11px] text-white/30 line-clamp-2">
              {match.kalshi.rules_primary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-white/25">{label}</span>
      <span className="font-mono text-white/50 truncate ml-2 max-w-[180px]">
        {value}
      </span>
    </div>
  );
}
