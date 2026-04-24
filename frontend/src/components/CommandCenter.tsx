"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { StatusDot } from "./StatusDot";
import { GlitchText } from "@/components/ui/glitch-text";
import type { SystemStatus } from "@/types/market";

interface CommandCenterProps {
  status: SystemStatus;
  totalCapital: number;
  pnl24hr: number;
  activePositions: number;
  totalMatches: number;
}

/**
 * Command Center header — styled to match the AXIOM landing boot screen.
 * Left: AXIOM glitch wordmark + bracketed "[ Command Center ]" label.
 * Right: system-status dots.
 * Lower band: metric tickers (capital, PnL, positions, matches).
 *
 * No heavy glass / gradient text — pure HUD: black/60 plates with
 * hairline `border-white/5`, mono uppercase labels at wide tracking,
 * emerald-400 accent for the live dot.
 */
export function CommandCenter({
  status,
  totalCapital,
  pnl24hr,
  activePositions,
  totalMatches,
}: CommandCenterProps) {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative border-b border-white/5 bg-black/70 backdrop-blur-md"
    >
      <div className="max-w-[1400px] mx-auto px-6 pt-4 pb-3">
        {/* Top row — AXIOM wordmark + status */}
        <div className="flex items-center justify-between gap-6">
          {/* Brand block */}
          <div className="flex items-center gap-5 min-w-0">
            <GlitchText
              text="AXIOM"
              intensity={2}
              className="select-none font-sans font-black uppercase leading-none tracking-[-0.04em] text-white text-xl md:text-2xl"
              style={{
                textShadow:
                  "0 0 18px rgba(0, 255, 136, 0.12), 0 0 40px rgba(0, 0, 0, 0.6)",
              }}
            />

            <span className="h-5 w-px bg-white/15" aria-hidden />

            <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">
              <span className="h-px w-6 bg-white/20" />
              <span>[ Command Center ]</span>
            </div>
          </div>

          {/* Status dots */}
          <div className="flex items-center gap-5 md:gap-6">
            <StatusDot status={status.vpsUptime} label="VPS" />
            <StatusDot status={status.kalshiSocket} label="Kalshi" />
            <StatusDot status={status.polySocket} label="Poly" />
            <StatusDot status={status.aiEngine} label="AI Engine" />
          </div>
        </div>

        {/* Bottom row — metrics */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-x-10 gap-y-3 flex-wrap">
          <MetricTicker
            label="Total Capital"
            value={totalCapital}
            prefix="$"
            decimals={0}
          />
          <MetricTicker
            label="24h PnL"
            value={pnl24hr}
            prefix={pnl24hr >= 0 ? "+$" : "-$"}
            decimals={2}
            color={pnl24hr >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <MetricTicker
            label="Active Positions"
            value={activePositions}
            decimals={0}
          />
          <MetricTicker
            label="AI Matches"
            value={totalMatches}
            decimals={0}
          />

          <div className="flex-1" />

          {/* Live heartbeat, far right — matches landing's top-bar ping */}
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] text-white/40">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span>System Nominal</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function MetricTicker({
  label,
  value,
  prefix = "",
  decimals = 0,
  color = "text-white/90",
}: {
  label: string;
  value: number;
  prefix?: string;
  decimals?: number;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-white/35">
        <span className="h-px w-3 bg-white/15" />
        <span>{label}</span>
      </div>
      <span
        className={`font-mono text-base md:text-lg font-semibold tabular-nums leading-none ${color}`}
      >
        {prefix}
        <CountUp
          end={Math.abs(value)}
          decimals={decimals}
          duration={2}
          separator=","
          preserveValue
        />
      </span>
    </div>
  );
}
