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
      className="relative bg-obsidian-light border border-white/10 rounded-sm overflow-hidden p-12 flex flex-col items-center justify-center text-center min-h-[300px]"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,240,255,0.05) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-12 bg-white/20" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
            Command Center
          </span>
          <div className="h-px w-12 bg-white/20" />
        </div>
        
        <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-widest uppercase glitch-text mb-8">
          AXIOM
        </h1>
        
        <div className="font-mono text-xs text-white/50 tracking-widest uppercase mb-8 flex items-center justify-center gap-4">
          <span>CROSS-PLAT9&DP</span>
          <span>LBEG2V@DV</span>
          <span>Z6T54U</span>
        </div>

        <p className="text-sm text-white/40 max-w-lg mx-auto mb-12 leading-relaxed">
          Real-time detection of pricing dislocations across prediction markets, reconciled by a dedicated AI matching layer.
        </p>

        <button className="group relative inline-flex items-center justify-center px-8 py-3 text-xs font-mono uppercase tracking-widest text-white/80 border border-white/20 rounded-full hover:bg-white/5 transition-all">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            ENTER SYSTEM [ENTER]
            <span className="ml-2 opacity-50 group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </button>

        <div className="mt-8 text-[9px] font-mono text-white/20 uppercase tracking-widest">
          PRESS ENTER OR CLICK TO INITIALIZE
        </div>
      </div>

      {/* Animated scanning bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.5), transparent)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}
