"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandCenter } from "@/components/CommandCenter";
import { TabNav, type TabId } from "@/components/TabNav";
import { StatsGrid } from "@/components/StatsGrid";
import { ArbitrageFeed } from "@/components/ArbitrageFeed";
import { AIReconciliationVisualizer } from "@/components/AIReconciliationVisualizer";
import { DashboardHero } from "@/components/DashboardHero";
import { useArbitrageData } from "@/hooks/useArbitrageData";

const pageVariants = {
  initial: { opacity: 0, y: 24, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -16, filter: "blur(4px)" },
};

const pageTransition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
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
    <div className="min-h-screen flex flex-col">
      {/* Command Center Header */}
      <CommandCenter
        status={systemStatus}
        totalCapital={totalCapital}
        pnl24hr={pnl24hr}
        activePositions={activePositions}
        totalMatches={totalMatches}
      />

      {/* Tab navigation bar */}
      <div className="sticky top-[88px] z-40 glass border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center justify-between">
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-neon-green"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-mono">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Tab content with page transitions */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="space-y-6"
            >
              <DashboardHero opportunities={opportunities} />
              <StatsGrid opportunities={opportunities} />

              {/* Top opportunities preview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white/70">
                    Top Opportunities
                  </h2>
                  <button
                    onClick={() => setActiveTab("feed")}
                    className="text-[11px] font-mono text-neon-blue/70 hover:text-neon-blue transition-colors"
                  >
                    View all →
                  </button>
                </div>
                <ArbitrageFeed opportunities={opportunities.slice(0, 5)} compact />
              </div>
            </motion.div>
          )}

          {activeTab === "feed" && (
            <motion.div
              key="feed"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <ArbitrageFeed opportunities={opportunities} />
            </motion.div>
          )}

          {activeTab === "ai" && (
            <motion.div
              key="ai"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <AIReconciliationVisualizer matches={matches} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-auto">
        <div className="w-full bg-obsidian border-b border-white/10 overflow-hidden py-2 flex items-center">
          <div className="flex-1 overflow-hidden relative">
            <motion.div 
              className="flex whitespace-nowrap gap-8 px-4 text-[11px] font-mono text-white/80 font-bold uppercase tracking-widest"
              animate={{ x: [0, -1000] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span>AI RECONCILIATION</span>
              <span className="text-white/30">♦</span>
              <span>REAL-TIME SPREADS</span>
              <span className="text-white/30">♦</span>
              <span>EXECUTION READY</span>
              <span className="text-white/30">♦</span>
              <span>POLYMARKET × KALSHI</span>
              <span className="text-white/30">♦</span>
              <span>CROSS-PLATFORM DETECTION</span>
              <span className="text-white/30">♦</span>
              {/* Duplicate for seamless loop */}
              <span>AI RECONCILIATION</span>
              <span className="text-white/30">♦</span>
              <span>REAL-TIME SPREADS</span>
              <span className="text-white/30">♦</span>
              <span>EXECUTION READY</span>
              <span className="text-white/30">♦</span>
              <span>POLYMARKET × KALSHI</span>
              <span className="text-white/30">♦</span>
              <span>CROSS-PLATFORM DETECTION</span>
              <span className="text-white/30">♦</span>
            </motion.div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold">N</div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              2026 AXIOM. ALL SYSTEMS OPERATIONAL.
            </span>
          </div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider border border-white/10 rounded-full px-4 py-1">
            CRAFTED WITH ♥ FOR MARKETS
          </div>
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            V1.0 · PREDICTION ARBITRAGE
          </span>
        </div>
      </footer>
    </div>
  );
}
