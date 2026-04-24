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
      borderColor: "border-neon-green/20",
      trend: "+12.5%",
      trendUp: true,
      sparkline: "M 0 20 Q 10 15 20 18 T 40 10 T 60 15 T 80 5 T 100 0",
    },
    {
      label: "Hot Spreads (>2%)",
      value: hot.length,
      decimals: 0,
      icon: Target,
      color: "text-neon-yellow",
      bgColor: "bg-neon-yellow/5",
      borderColor: "border-neon-yellow/20",
      trend: "+4.2%",
      trendUp: true,
      sparkline: "M 0 15 Q 15 20 25 10 T 50 15 T 75 5 T 100 10",
    },
    {
      label: "Avg Spread",
      value: avgSpread,
      decimals: 2,
      suffix: "%",
      icon: Percent,
      color: "text-neon-blue",
      bgColor: "bg-neon-blue/5",
      borderColor: "border-neon-blue/20",
      trend: "+0.8%",
      trendUp: true,
      sparkline: "M 0 10 Q 20 5 40 15 T 70 10 T 100 5",
    },
    {
      label: "Max Spread",
      value: maxSpread,
      decimals: 2,
      suffix: "%",
      icon: BarChart3,
      color: "text-neon-purple",
      bgColor: "bg-neon-purple/5",
      borderColor: "border-neon-purple/20",
      trend: "-1.2%",
      trendUp: false,
      sparkline: "M 0 5 Q 20 10 40 5 T 70 15 T 100 20",
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
      borderColor: "border-white/[0.1]",
      trend: "+18.4%",
      trendUp: true,
      sparkline: "M 0 20 Q 15 15 30 18 T 60 10 T 100 2",
    },
    {
      label: "Avg AI Match",
      value: avgMatch * 100,
      decimals: 1,
      suffix: "%",
      icon: Layers,
      color: "text-neon-purple",
      bgColor: "bg-neon-purple/5",
      borderColor: "border-neon-purple/20",
      trend: "+2.1%",
      trendUp: true,
      sparkline: "M 0 15 Q 20 15 40 10 T 70 12 T 100 5",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          whileHover={{ y: -2, scale: 1.02 }}
          className={`bg-obsidian-light rounded-sm p-4 border border-white/10 relative overflow-hidden group hover:border-white/30 transition-colors`}
        >
          {/* Sparkline Background */}
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-full">
              <path
                d={stat.sparkline}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={stat.color}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={`${stat.sparkline} L 100 24 L 0 24 Z`}
                fill="currentColor"
                className={stat.color}
                opacity="0.1"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-1.5 rounded-sm ${stat.bgColor} border ${stat.borderColor}`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                stat.trendUp 
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/20" 
                  : "bg-neon-red/10 text-neon-red border border-neon-red/20"
              }`}>
                {stat.trend}
              </div>
            </div>
            
            <div className="font-mono text-2xl font-bold tabular-nums text-white/95 tracking-tight mt-2">
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
            <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-mono">
              {stat.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
