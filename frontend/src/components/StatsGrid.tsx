"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  TrendingUp,
  BarChart3,
  Target,
  Layers,
  DollarSign,
  Percent,
} from "lucide-react";
import type { ArbitrageOpportunity } from "@/types/market";

interface StatsGridProps {
  opportunities: ArbitrageOpportunity[];
}

export function StatsGrid({ opportunities }: StatsGridProps) {
  const profitable = opportunities.filter((o) => o.spread > 0);
  const hot = opportunities.filter((o) => o.spread >= 2);
  const avgSpread =
    profitable.length > 0
      ? profitable.reduce((s, o) => s + o.spread, 0) / profitable.length
      : 0;
  const maxSpread = Math.max(...opportunities.map((o) => o.spread), 0);
  const totalVolume = opportunities.reduce(
    (s, o) => s + o.polymarket.volumeNum,
    0
  );
  const avgMatch =
    opportunities.length > 0
      ? opportunities.reduce((s, o) => s + o.matchScore, 0) /
        opportunities.length
      : 0;

  const stats = [
    {
      label: "Profitable Pairs",
      value: profitable.length,
      decimals: 0,
      icon: TrendingUp,
      color: "text-neon-green",
      bgColor: "bg-neon-green/5",
      borderColor: "border-neon-green/10",
    },
    {
      label: "Hot Spreads (>2%)",
      value: hot.length,
      decimals: 0,
      icon: Target,
      color: "text-neon-yellow",
      bgColor: "bg-neon-yellow/5",
      borderColor: "border-neon-yellow/10",
    },
    {
      label: "Avg Spread",
      value: avgSpread,
      decimals: 2,
      suffix: "%",
      icon: Percent,
      color: "text-neon-blue",
      bgColor: "bg-neon-blue/5",
      borderColor: "border-neon-blue/10",
    },
    {
      label: "Max Spread",
      value: maxSpread,
      decimals: 2,
      suffix: "%",
      icon: BarChart3,
      color: "text-neon-purple",
      bgColor: "bg-neon-purple/5",
      borderColor: "border-neon-purple/10",
    },
    {
      label: "Total Volume",
      value: totalVolume / 1_000_000,
      decimals: 1,
      suffix: "M",
      prefix: "$",
      icon: DollarSign,
      color: "text-white/70",
      bgColor: "bg-white/[0.03]",
      borderColor: "border-white/[0.06]",
    },
    {
      label: "Avg AI Match",
      value: avgMatch * 100,
      decimals: 1,
      suffix: "%",
      icon: Layers,
      color: "text-neon-purple",
      bgColor: "bg-neon-purple/5",
      borderColor: "border-neon-purple/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          className={`glass rounded-xl p-4 border ${stat.borderColor}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            </div>
          </div>
          <div className="font-mono text-xl font-bold tabular-nums text-white/90">
            {stat.prefix ?? ""}
            <CountUp
              end={stat.value}
              decimals={stat.decimals}
              duration={1.5}
              separator=","
              preserveValue
            />
            {stat.suffix ?? ""}
          </div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
