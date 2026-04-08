"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
            <Brain className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white/90">
              AI Reconciliation Engine
            </h2>
            <p className="text-xs text-white/30 font-mono">
              Semantic embedding similarity via all-mpnet-base-v2
            </p>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/40">
            {activeIndex + 1} of {matches.length} pairs
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="p-2 rounded-lg glass glass-hover disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={() => setActiveIndex(Math.min(matches.length - 1, activeIndex + 1))}
              disabled={activeIndex === matches.length - 1}
              className="p-2 rounded-lg glass glass-hover disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Main visualizer card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-2xl overflow-hidden"
        >
          {/* Split pane — full width 3-column */}
          <div className="grid grid-cols-[1fr_200px_1fr] min-h-[280px]">
            {/* Polymarket side */}
            <div className="p-6 border-r border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-neon-blue"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neon-blue font-semibold">
                  Polymarket
                </span>
              </div>

              <p className="text-base text-white/90 leading-relaxed font-medium mb-5">
                {match.polymarket.title}
              </p>

              <div className="space-y-2.5">
                <MetaLine label="Market ID" value={match.polymarket.id} />
                <MetaLine label="End Date" value={new Date(match.polymarket.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
                <MetaLine label="Volume" value={`$${match.polymarket.volumeNum.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <MetaLine label="Liquidity" value={`$${parseFloat(match.polymarket.liquidity).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              </div>

              {/* Description excerpt */}
              <div className="mt-5 pt-4 border-t border-white/5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/20 block mb-2">
                  Description
                </span>
                <p className="text-[11px] text-white/30 leading-relaxed line-clamp-3">
                  {match.polymarket.description}
                </p>
              </div>
            </div>

            {/* Center — Confidence beam */}
            <div className="flex flex-col items-center justify-center relative overflow-hidden">
              {/* Vertical beam lines */}
              <motion.div
                className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2"
                style={{
                  background: "linear-gradient(to bottom, transparent, rgba(168,85,247,0.15), transparent)",
                }}
              />

              {/* Animated particles flowing down */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-purple/40"
                  animate={{
                    y: [-20, 300],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.8,
                    ease: "linear",
                  }}
                />
              ))}

              {/* Confidence circle */}
              <motion.div
                className={cn(
                  "relative w-24 h-24 rounded-full flex items-center justify-center z-10",
                  isHighConfidence
                    ? "border-2 border-neon-green/40"
                    : "border-2 border-neon-purple/40"
                )}
                style={{
                  background: isHighConfidence
                    ? "radial-gradient(circle, rgba(0,255,136,0.06), transparent 70%)"
                    : "radial-gradient(circle, rgba(168,85,247,0.06), transparent 70%)",
                }}
              >
                {/* Outer pulse ring */}
                <motion.div
                  className={cn(
                    "absolute inset-[-4px] rounded-full",
                    isHighConfidence
                      ? "border border-neon-green/15"
                      : "border border-neon-purple/15"
                  )}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />

                <div className="text-center">
                  <motion.span
                    key={confidencePercent}
                    initial={{ scale: 0.5, opacity: 0, filter: "blur(4px)" }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "text-2xl font-mono font-bold block leading-none",
                      isHighConfidence ? "text-neon-green" : "text-neon-purple"
                    )}
                  >
                    {confidencePercent}%
                  </motion.span>
                  <span className="text-[8px] uppercase tracking-[0.2em] text-white/30 mt-1 block">
                    Confidence
                  </span>
                </div>
              </motion.div>

              {/* Connection arrows */}
              <div className="flex items-center gap-2 mt-4">
                <motion.div
                  className="h-px w-8 bg-gradient-to-r from-neon-blue/60 to-transparent"
                  animate={{ scaleX: [0.5, 1, 0.5], opacity: [0.3, 0.9, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-neon-purple/60" />
                </motion.div>
                <motion.div
                  className="h-px w-8 bg-gradient-to-l from-neon-yellow/60 to-transparent"
                  animate={{ scaleX: [0.5, 1, 0.5], opacity: [0.3, 0.9, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                />
              </div>

              <span className="text-[8px] font-mono text-white/15 uppercase tracking-[0.15em] mt-3">
                Cosine Similarity
              </span>
            </div>

            {/* Kalshi side */}
            <div className="p-6 border-l border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-neon-yellow"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neon-yellow font-semibold">
                  Kalshi
                </span>
              </div>

              <p className="text-base text-white/90 leading-relaxed font-medium mb-5">
                {match.kalshi.title}
              </p>

              <div className="space-y-2.5">
                <MetaLine label="Ticker" value={match.kalshi.ticker} />
                <MetaLine label="Close Date" value={new Date(match.kalshi.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
                <MetaLine label="Volume" value={`$${parseFloat(match.kalshi.volume_fp).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <MetaLine label="YES / NO" value={`$${match.kalshi.yes_ask_dollars} / $${match.kalshi.no_ask_dollars}`} />
              </div>

              {/* Rules */}
              <div className="mt-5 pt-4 border-t border-white/5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/20 block mb-2">
                  Resolution Rules
                </span>
                <p className="text-[11px] text-white/30 leading-relaxed line-clamp-3">
                  {match.kalshi.rules_primary}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar — spread direction */}
          <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/25">STRATEGY</span>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-neon-blue">Poly YES</span>
                <ArrowRight className="w-3 h-3 text-white/20" />
                <span className="text-neon-yellow">Kalshi NO</span>
                <span className="text-white/20 mx-1">or</span>
                <span className="text-neon-yellow">Kalshi YES</span>
                <ArrowRight className="w-3 h-3 text-white/20" />
                <span className="text-neon-blue">Poly NO</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-white/20">
              Threshold: 0.90 cosine
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Match list thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {matches.map((m, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "shrink-0 px-3 py-2 rounded-lg text-[10px] font-mono transition-all border",
              i === activeIndex
                ? "bg-white/[0.08] border-white/[0.15] text-white/80"
                : "bg-white/[0.02] border-transparent text-white/30 hover:bg-white/[0.04] hover:text-white/50"
            )}
          >
            <span className="block truncate max-w-[140px]">
              {m.polymarket.title.length > 25
                ? m.polymarket.title.slice(0, 25) + "..."
                : m.polymarket.title}
            </span>
            <span className={cn(
              "text-[9px]",
              m.score >= 0.95 ? "text-neon-green/60" : "text-neon-purple/60"
            )}>
              {(m.score * 100).toFixed(1)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] text-white/25 shrink-0">{label}</span>
      <span className="font-mono text-[11px] text-white/55 truncate text-right">
        {value}
      </span>
    </div>
  );
}
