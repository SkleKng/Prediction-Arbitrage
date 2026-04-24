"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandCenter } from "@/components/CommandCenter";
import { TabNav, type TabId } from "@/components/TabNav";
import { StatsGrid } from "@/components/StatsGrid";
import { ArbitrageFeed } from "@/components/ArbitrageFeed";
import { AIReconciliationVisualizer } from "@/components/AIReconciliationVisualizer";
import { DashboardHero } from "@/components/DashboardHero";
import { SystemBoot } from "@/components/SystemBoot";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";
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
  // `isBooted` flips to true after the SystemBoot overlay finishes fading
  // out. Once true, SystemBoot is completely removed from the tree so the
  // GSAP canvas loop stops burning CPU while the dashboard is live.
  const [isBooted, setIsBooted] = useState(false);
  const {
    opportunities,
    systemStatus,
    totalCapital,
    pnl24hr,
    activePositions,
    totalMatches,
    matches,
  } = useArbitrageData();

  const topOpportunities = useMemo(() => opportunities.slice(0, 5), [opportunities]);

  return (
    <div className="relative min-h-screen flex flex-col font-sans text-white">
      {!isBooted && <SystemBoot onFadeComplete={() => setIsBooted(true)} />}

      {/* Same ambient background used on the landing — aurora orbs, noise,
          vignette. Sits behind the entire dashboard so the visual language
          carries through from boot → command center. */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AmbientBackdrop />
      </div>

      {/* HUD corner brackets — framing for the viewport, identical to boot */}
      <CornerBrackets />

      {/* Vertical edge labels — flavor, matches landing */}
      <div className="pointer-events-none fixed left-3 top-1/2 z-10 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180 font-mono text-[10px] uppercase tracking-[0.4em] text-white/20 hidden lg:block">
        Polymarket × Kalshi
      </div>
      <div className="pointer-events-none fixed right-3 top-1/2 z-10 -translate-y-1/2 [writing-mode:vertical-rl] font-mono text-[10px] uppercase tracking-[0.4em] text-white/20 hidden lg:block">
        AI Reconciliation Layer
      </div>

      {/* Header: Command Center + Tabs */}
      <div className="relative z-40">
        <CommandCenter
          status={systemStatus}
          totalCapital={totalCapital}
          pnl24hr={pnl24hr}
          activePositions={activePositions}
          totalMatches={totalMatches}
        />

        {/* Tab navigation bar */}
        <div className="border-b border-white/5 bg-black/60">
          <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center justify-between">
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="hidden md:flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em] text-white/30">
              <span className="h-px w-6 bg-white/15" />
              <span>Cross-Platform Arbitrage Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab content with page transitions */}
      <main className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="space-y-8"
            >
              <DashboardHero opportunities={opportunities} />
              <StatsGrid opportunities={opportunities} />

              {/* Top opportunities preview */}
              <div>
                <SectionHeader
                  eyebrow="[ Opportunities ]"
                  title="Top Spreads"
                  right={
                    <button
                      onClick={() => setActiveTab("feed")}
                      className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors"
                    >
                      <span>View all</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  }
                />
                <ArbitrageFeed opportunities={topOpportunities} compact />
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

      {/* Footer — thin HUD band. Matches the aesthetic of CinematicFooter
          on the landing but quieter (no marquee, no CTA — this is the
          operating dashboard, not a marketing surface). */}
      <footer className="relative z-10 border-t border-white/5 mt-auto bg-black/60">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
          <span>AXIOM // v1.0.0 // Command Center</span>
          <span className="hidden md:inline">
            Polymarket × Kalshi &nbsp;/&nbsp; AI Reconciliation Layer
          </span>
          <span className="tabular-nums">All Systems Nominal</span>
        </div>
      </footer>
    </div>
  );
}

/** Thin L-shaped brackets in each viewport corner — same as landing. */
function CornerBrackets() {
  const common = "pointer-events-none fixed z-20 h-5 w-5 border-white/25";
  return (
    <>
      <span className={`${common} top-3 left-3 border-t border-l`} aria-hidden />
      <span className={`${common} top-3 right-3 border-t border-r`} aria-hidden />
      <span
        className={`${common} bottom-3 left-3 border-b border-l`}
        aria-hidden
      />
      <span
        className={`${common} bottom-3 right-3 border-b border-r`}
        aria-hidden
      />
    </>
  );
}

/** Shared section header with bracketed eyebrow + title. Mirrors the
 * "[ Command Center ]" motif on the landing so sections feel like
 * chapters of the same document. */
function SectionHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">
          <span className="h-px w-8 bg-white/20" />
          <span>{eyebrow}</span>
        </div>
        <h2 className="font-sans text-lg md:text-xl font-semibold tracking-tight text-white/90">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}
