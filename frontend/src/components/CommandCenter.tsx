"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Activity, Zap, Brain, Wifi } from "lucide-react";
import { StatusDot } from "./StatusDot";
import type { SystemStatus } from "@/types/market";

interface CommandCenterProps {
  status: SystemStatus;
  totalCapital: number;
  pnl24hr: number;
  activePositions: number;
  totalMatches: number;
}

export function CommandCenter({
  status,
  totalCapital,
  pnl24hr,
  activePositions,
  totalMatches,
}: CommandCenterProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 bg-obsidian border-b border-white/10 shadow-2xl"
    >
      <div className="max-w-[1400px] mx-auto px-6 py-3">
        {/* Top row - Brand + Status */}
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-widest uppercase glitch-text">
                AXIOM
              </h1>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
              Nexus Control
            </span>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-6">
            <StatusDot status={status.vpsUptime} label="VPS" />
            <StatusDot status={status.kalshiSocket} label="Kalshi" />
            <StatusDot status={status.polySocket} label="Poly" />
            <StatusDot status={status.aiEngine} label="AI Engine" />
          </div>
        </div>

        {/* Bottom row - Metrics */}
        <div className="flex items-center gap-8 mt-2 pt-2 border-t border-white/5">
          {/* Total Capital */}
          <MetricTicker
            label="Total Capital"
            value={totalCapital}
            prefix="$"
            decimals={0}
            icon={<Activity className="w-3.5 h-3.5" />}
          />

          {/* 24hr PnL */}
          <MetricTicker
            label="24hr PnL"
            value={pnl24hr}
            prefix={pnl24hr >= 0 ? "+$" : "-$"}
            decimals={2}
            icon={<Zap className="w-3.5 h-3.5" />}
            color={pnl24hr >= 0 ? "text-neon-green" : "text-neon-red"}
          />

          {/* Active Positions */}
          <MetricTicker
            label="Active Positions"
            value={activePositions}
            decimals={0}
            icon={<Wifi className="w-3.5 h-3.5" />}
          />

          {/* AI Matches */}
          <MetricTicker
            label="AI Matches"
            value={totalMatches}
            decimals={0}
            icon={<Brain className="w-3.5 h-3.5" />}
          />

          {/* Spacer */}
          <div className="flex-1" />
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
  icon,
  color = "text-white",
}: {
  label: string;
  value: number;
  prefix?: string;
  decimals?: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-white/30">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 leading-none">
          {label}
        </span>
        <span className={`text-base font-mono font-semibold tabular-nums ${color}`}>
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
    </div>
  );
}
