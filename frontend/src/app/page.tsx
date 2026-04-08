"use client";

import { motion } from "framer-motion";
import { CommandCenter } from "@/components/CommandCenter";
import { StatsGrid } from "@/components/StatsGrid";
import { ArbitrageFeed } from "@/components/ArbitrageFeed";
import { AIReconciliationVisualizer } from "@/components/AIReconciliationVisualizer";
import { useArbitrageData } from "@/hooks/useArbitrageData";

export default function Home() {
  const {
    opportunities,
    systemStatus,
    totalCapital,
    pnl24hr,
    activePositions,
    totalMatches,
    matches,
  } = useArbitrageData();

  return (
    <div className="min-h-screen">
      {/* Command Center Header */}
      <CommandCenter
        status={systemStatus}
        totalCapital={totalCapital}
        pnl24hr={pnl24hr}
        activePositions={activePositions}
        totalMatches={totalMatches}
      />

      {/* Main content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">
        {/* Stats overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatsGrid opportunities={opportunities} />
        </motion.section>

        {/* Two-column layout: Feed + AI Visualizer */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
          {/* Live Arbitrage Feed */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ArbitrageFeed opportunities={opportunities} />
          </motion.section>

          {/* AI Reconciliation Visualizer */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="xl:sticky xl:top-[110px] xl:self-start"
          >
            <AIReconciliationVisualizer matches={matches} />
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider">
            Prediction Arbitrage System v1.0
          </span>
          <span className="text-[10px] font-mono text-white/20">
            Polymarket x Kalshi | AI-Powered Cross-Platform Detection
          </span>
        </div>
      </footer>
    </div>
  );
}
